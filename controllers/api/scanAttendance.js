const QRCode = require("qrcode");
const geolib = require("geolib");
const moment = require("moment");
const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');
const con = require("../../config/db");
const { validator, schemas } = require('../../validation/scanAttendance');

// Company's location (latitude and longitude)
const COMPANY_LOCATION = {
  latitude: 11.572487157375708,
  longitude: 104.89329756764403,
};

// Allowed radius in meters
const ALLOWED_RADIUS = 100;

// Function to validate user's location
const validateLocation = (userLatitude, userLongitude) => {
  const userLocation = { latitude: userLatitude, longitude: userLongitude };
  const distance = geolib.getDistance(COMPANY_LOCATION, userLocation);
  return distance <= ALLOWED_RADIUS;
};

const TELEGRAM_BOT_TOKEN = '7668502583:AAEZYS5tS9TaAnQdtXDlA6h01amzV5sURFQ';
const TELEGRAM_GROUP_ID = '-1002445645671';
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });

const HR_BOT_TOKEN = '7791829575:AAHj9bru1zlPeo4vk8Uk5hQxsiEGzXv1Db4';
const HR_CHAT_ID = '-1002255661744';
const hrBot = new TelegramBot(HR_BOT_TOKEN, { polling: false });

// Function to send a message to the Telegram group
const sendTelegramAlert = async (message) => {
  try {
    await bot.sendMessage(TELEGRAM_GROUP_ID, message);
  } catch (error) {
    console.log('Error sending Telegram alert:', error);
  }
};

// Function to send a message to the HR bot
const sendHRAlert = async (message) => {
  try {
    await hrBot.sendMessage(HR_CHAT_ID, message);
  } catch (error) {
    console.log('Error sending HR alert:', error);
  }
};

// Shift timings in local time (Phnom Penh)
const SHIFT_TIMINGS = {
  morning: {
    start: moment("08:00", "HH:mm"),
    end: moment("12:00", "HH:mm"),
  },
  afternoon: {
    start: moment("13:00", "HH:mm"),
    end: moment("18:00", "HH:mm"),
  },
};

// Tracking whether the alert has been sent for each shift
let morningCheckInSent = false;
let morningCheckOutSent = false;
let afternoonCheckInSent = false;
let afternoonCheckOutSent = false;

// Function to reset flags at the start of each shift
const resetShiftFlags = () => {
  const currentTime = moment();
  if (currentTime.isAfter(SHIFT_TIMINGS.morning.end)) {
    morningCheckInSent = false;
    morningCheckOutSent = false;
  }
  if (currentTime.isAfter(SHIFT_TIMINGS.afternoon.end)) {
    afternoonCheckInSent = false;
    afternoonCheckOutSent = false;
  }
};

// Schedule reset of flags at midnight (every day)
cron.schedule('0 0 * * *', resetShiftFlags);

// Schedule morning check-in alert at 7:55 AM
// Schedule morning check-in alert at 7:45 AM (15 minutes before)
cron.schedule('45 7 * * 1-5', () => {
  const currentTime = moment();
  if (!morningCheckInSent) {
    const message = "⏰ It's almost time to check in for the morning shift! Please scan the QR code within the next 15 minutes.";
    sendTelegramAlert(message);
    morningCheckInSent = true;
  }
});

// Schedule morning check-out alert at 11:45 AM (15 minutes before)
cron.schedule('45 11 * * 1-5', () => {
  const currentTime = moment();
  if (!morningCheckOutSent) {
    const message = "⏰ It's almost time to check out for the morning shift! Please scan the QR code within the next 15 minutes.";
    sendTelegramAlert(message);
    morningCheckOutSent = true;
  }
});

// Schedule afternoon check-in alert at 12:45 PM (15 minutes before)
cron.schedule('45 12 * * 1-5', () => {
  const currentTime = moment();
  if (!afternoonCheckInSent) {
    const message = "⏰ It's almost time to check in for the afternoon shift! Please scan the QR code within the next 15 minutes.";
    sendTelegramAlert(message);
    afternoonCheckInSent = true;
  }
});

// Schedule afternoon check-out alert at 4:45 PM (15 minutes before)
cron.schedule('45 16 * * 1-5', () => {
  const currentTime = moment();
  if (!afternoonCheckOutSent) {
    const message = "⏰ It's almost time to check out for the afternoon shift! Please scan the QR code within the next 15 minutes.";
    sendTelegramAlert(message);
    afternoonCheckOutSent = true;
  }
});

const scanQR = async (req, res) => {
  const { code, user_id, latitude, longitude } = req.body;

  // Validate the input
  const { error, value } = validator(schemas.scanQR)(req.body);
  if (error) {
    console.log("[ERROR] Validation errors:", error.details.map((err) => err.message));
    return res.status(400).json({
      result: false,
      msg: "Validation errors",
      errors: error.details.map((err) => err.message),
    });
  }

  // Validate location
  if (!validateLocation(latitude, longitude)) {
    console.log("[ERROR] User location is outside the allowed radius.");
    return res.status(403).json({
      error: "QR code can only be scanned within the company premises.",
    });
  }

  const scanTime = moment(); // Use local time
  const dayOfWeek = scanTime.day();
  const date = scanTime.format('YYYY-MM-DD');
  const timeString = scanTime.format("h:mm A");
  const timeFormat = scanTime.format('YYYY-MM-DD HH:mm:ss');

  // Check if it's a weekend or holiday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
  const holidayQuery = `
    SELECT * 
    FROM tbl_overtime 
    WHERE user_id = ? AND request_date = ? AND overtime_type = 'Holiday'
  `;
  const [holidayResult] = await con.query(holidayQuery, [user_id, date]);
  const isHoliday = Array.isArray(holidayResult) && holidayResult.length > 0;

  // Check if the user has an OT assignment or approved OT request
  const otQuery = `
    SELECT * 
    FROM tbl_overtime 
    WHERE user_id = ? AND DATE(request_date) = ? AND (action_status = 'Assigned' OR action_status = 'Approved')
  `;
  const [otResult] = await con.query(otQuery, [user_id, date]);

  let shift;
  if (isWeekend || isHoliday) {
    // Weekend/Holiday Logic
    if (otResult.length === 0) {
      console.log("[ERROR] Scanning is not allowed on weekends or holidays unless assigned to OT.");
      return res.status(403).json({
        error: "Scanning is not allowed on weekends or holidays unless assigned to OT.",
      });
    }

    const otRecord = otResult[0];
    const startTime = moment(otRecord.start_time, "hh:mm A");
    const endTime = moment(otRecord.end_time, "hh:mm A");

    // Add early/late tolerance (e.g., ±15 minutes)
    const tolerance = 15; // in minutes
    const earlyStartTime = moment(startTime).subtract(tolerance, "minutes");
    const lateEndTime = moment(endTime).add(tolerance, "minutes");

    // Enforce strict validation of assigned OT hours
    if (!scanTime.isBetween(earlyStartTime, lateEndTime)) {
      console.log("[ERROR] User is not authorized to scan outside their approved OT hours (with tolerance).");
      return res.status(403).json({
        error: "You are not authorized to scan outside your approved OT hours (with tolerance).",
      });
    }

    // Ensure attendance record exists for the day
    const attendanceQuery = `
      SELECT attendance_id 
      FROM tbl_attendance 
      WHERE user_id = ? AND date = ?
    `;
    const [attendanceResult] = await con.query(attendanceQuery, [user_id, date]);
    let attendanceId;
    if (!Array.isArray(attendanceResult) || attendanceResult.length === 0) {
      const insertAttendanceQuery = `
        INSERT INTO tbl_attendance (user_id, date) 
        VALUES (?, ?)
      `;
      const [insertResult] = await con.query(insertAttendanceQuery, [user_id, date]);
      attendanceId = insertResult.insertId;
    } else {
      attendanceId = attendanceResult[0].attendance_id;
    }

    // Determine the next OT scan type (OT_checkin or OT_checkout)
    const otScansQuery = `
      SELECT scan_type, scan_time, status 
      FROM tbl_attendance_scan 
      WHERE attendance_id = ? AND scan_type IN ('OT_checkin', 'OT_checkout') 
      ORDER BY scan_time DESC
    `;
    const [otScansResult] = await con.query(otScansQuery, [attendanceId]);

    let nextScanType, status;
    if (otScansResult.length === 0) {
      // No OT scans yet, enforce OT_checkin
      nextScanType = "OT_checkin";
      // Determine status for OT_checkin
      if (scanTime.isBefore(startTime)) {
        status = "Early";
      } else if (scanTime.isBetween(startTime, moment(startTime).add(15, "minutes"))) {
        status = "On-Time";
      } else if (scanTime.isAfter(moment(startTime).add(1, "hour"))) {
        status = "Absent";
      } else {
        status = "Late";
      }
    } else {
      const lastScanType = otScansResult[0].scan_type;
      const lastScanStatus = otScansResult[0].status;

      if (lastScanType === "OT_checkin") {
        if (lastScanStatus === "Absent") {
          return res.status(403).json({
            error: "You cannot perform OT_checkout because you were marked absent for OT_checkin.",
          });
        }

        // Enforce OT_checkout, but only if at least 1 hour has passed since OT_checkin
        const lastScanTime = moment(otScansResult[0].scan_time);
        if (scanTime.diff(lastScanTime, "hours") < 1) {
          return res.status(403).json({
            error: "You must wait at least 1 hour after OT_checkin before performing OT_checkout.",
          });
        }

        nextScanType = "OT_checkout";
        // Determine status for OT_checkout
        if (scanTime.isBefore(endTime)) {
          status = "Early";
        } else if (scanTime.isBetween(endTime, moment(endTime).add(15, "minutes"))) {
          status = "On-Time";
        } else {
          status = "Late";
        }
      } else {
        return res.status(403).json({
          error: "You have already performed OT_checkout for today.",
        });
      }
    }

    try {
      const formattedScanTime = scanTime.format("YYYY-MM-DD h:mm A");

      // Insert the scan record into the database
      const insertScanQuery = `
        INSERT INTO tbl_attendance_scan 
        (attendance_id, scan_type, scan_time, status) 
        VALUES (?, ?, ?, ?)
      `;
      await con.query(insertScanQuery, [attendanceId, nextScanType, timeFormat, status]);

      console.log(`[DEBUG] Successfully inserted scan record - Type: ${nextScanType}, Time: ${formattedScanTime}, Status: ${status}`);
      return res.json({
        message: `Scanned successfully for ${nextScanType}.`,
        scanTime: formattedScanTime,
        status,
        scanType: nextScanType,
      });
    } catch (error) {
      console.log("[ERROR] An error occurred while processing the request:", error);
      return res.status(500).json({ error: "An error occurred while processing your request" });
    }
  } else {
    // Weekday Logic with OT Support
    if (otResult.length === 0) {
      // Normal weekday logic without OT
      if (scanTime.isBetween(moment("07:00", "HH:mm"), moment("12:00", "HH:mm"))) {
        shift = "m"; // Morning shift
      } else if (scanTime.isBetween(moment("13:00", "HH:mm"), moment("18:00", "HH:mm"))) {
        shift = "a"; // Afternoon shift
      } else {
        return res.status(400).json({ error: "Scanning is only allowed during working hours." });
      }
    } else {
      // Weekday OT logic
      shift = "ot";
    }

    try {
      // Ensure attendance record exists for the day
      const attendanceQuery = `
        SELECT attendance_id 
        FROM tbl_attendance 
        WHERE user_id = ? AND date = ?
      `;
      const [attendanceResult] = await con.query(attendanceQuery, [user_id, date]);
      let attendanceId;
      if (!Array.isArray(attendanceResult) || attendanceResult.length === 0) {
        const insertAttendanceQuery = `
          INSERT INTO tbl_attendance (user_id, date) 
          VALUES (?, ?)
        `;
        const [insertResult] = await con.query(insertAttendanceQuery, [user_id, date]);
        attendanceId = insertResult.insertId;
      } else {
        attendanceId = attendanceResult[0].attendance_id;
      }

      // Check the number of scans for the day
      const scanCountQuery = `
        SELECT COUNT(*) AS scan_count 
        FROM tbl_attendance_scan 
        WHERE attendance_id = ? AND DATE(scan_time) = ?
      `;
      const [scanCountResult] = await con.query(scanCountQuery, [attendanceId, date]);
      const scanCount = scanCountResult[0].scan_count;
      console.log(`[DEBUG] Daily Scan Count: ${scanCount}`);

      if (scanCount >= 6) {
        console.log("[ERROR] User has reached the maximum limit of 6 scans for today.");
        return res.status(403).json({
          error: "You have reached the maximum limit of 6 scans for today.",
        });
      }

      let scanType, status;

      if (shift === "ot") {
        // OT logic for scans after regular shifts
        const otRecord = otResult[0];
        const startTime = moment(otRecord.start_time, "hh:mm A");
        const endTime = moment(otRecord.end_time, "hh:mm A");

        // Add early/late tolerance
        const tolerance = 15; // in minutes
        const earlyStartTime = moment(startTime).subtract(tolerance, "minutes");
        const lateEndTime = moment(endTime).add(tolerance, "minutes");

        const otScansQuery = `
          SELECT scan_type, scan_time 
          FROM tbl_attendance_scan 
          WHERE attendance_id = ? AND scan_type IN ('OT_checkin', 'OT_checkout') 
          ORDER BY scan_time DESC
        `;
        const [otScansResult] = await con.query(otScansQuery, [attendanceId]);

        if (otScansResult.length === 0) {
          scanType = "OT_checkin";
          // Determine status for OT_checkin
          if (scanTime.isBefore(startTime)) {
            status = "Early";
          } else if (scanTime.isBetween(startTime, moment(startTime).add(15, "minutes"))) {
            status = "On-Time";
          } else if (scanTime.isAfter(moment(startTime).add(1, "hour"))) {
            status = "Absent";
          } else {
            status = "Late";
          }
        } else {
          const lastScanType = otScansResult[0].scan_type;
          const lastScanTime = moment(otScansResult[0].scan_time);

          if (lastScanType === "OT_checkin") {
            // Enforce OT_checkout, but only if at least 1 hour has passed
            if (scanTime.diff(lastScanTime, "hours") < 1) {
              return res.status(403).json({
                error: "You must wait at least 1 hour after OT_checkin before performing OT_checkout.",
              });
            }

            scanType = "OT_checkout";
            // Determine status for OT_checkout
            if (scanTime.isBefore(endTime)) {
              status = "Early";
            } else if (scanTime.isBetween(endTime, moment(endTime).add(15, "minutes"))) {
              status = "On-Time";
            } else {
              status = "Late";
            }
          } else {
            return res.status(403).json({
              error: "You have already performed OT_checkout for today.",
            });
          }
        }
      } else {
        // Regular shift logic
        const shiftScansQuery = `
          SELECT scan_type, status 
          FROM tbl_attendance_scan 
          WHERE attendance_id = ? AND scan_type IN (?, ?)
        `;
        const [shiftScansResult] = await con.query(shiftScansQuery, [
          attendanceId,
          `${shift}_checkin`,
          `${shift}_checkout`,
        ]);

        const checkInAbsent = shiftScansResult.some(
          (scan) => scan.scan_type === `${shift}_checkin` && scan.status === "Absent"
        );

        if (checkInAbsent) {
          // If the user is absent for check-in, prevent checkout
          if (shiftScansResult.some((scan) => scan.scan_type === `${shift}_checkout`)) {
            return res.status(403).json({
              error: `You cannot perform ${shift}_checkout because you were marked absent for ${shift}_checkin.`,
            });
          }

          // Allow OT_checkin if the user is absent for check-in and scanning during OT hours
          if (otResult.length > 0) {
            const otRecord = otResult[0];
            const startTime = moment(otRecord.start_time, "hh:mm A");
            const endTime = moment(otRecord.end_time, "hh:mm A");
            // Add early/late tolerance
            const tolerance = 15; // in minutes
            const earlyStartTime = moment(startTime).subtract(tolerance, "minutes");
            const lateEndTime = moment(endTime).add(tolerance, "minutes");
            // Enforce strict validation of assigned OT hours
            if (!scanTime.isBetween(earlyStartTime, lateEndTime)) {
              console.log("[ERROR] User is not authorized to scan outside their approved OT hours (with tolerance).");
              return res.status(403).json({
                error: "You are not authorized to scan outside your approved OT hours (with tolerance).",
              });
            }
            scanType = "OT_checkin";
            shift = "ot";
            // Determine status for OT_checkin
            if (scanTime.isBefore(startTime)) {
              status = "Early";
            } else if (scanTime.isBetween(startTime, moment(startTime).add(15, "minutes"))) {
              status = "On-Time";
            } else if (scanTime.isAfter(moment(startTime).add(1, "hour"))) {
              status = "Absent";
            } else {
              status = "Late";
            }
          } else {
            // Prevent further actions if no OT logic applies
            return res.status(403).json({
              error: `You cannot perform ${shift}_checkout because you were marked absent for ${shift}_checkin.`,
            });
          }
        } else {
          // Normal logic for users not marked absent
          if (
            shiftScansResult.some((scan) => scan.scan_type === `${shift}_checkin`) &&
            !shiftScansResult.some((scan) => scan.scan_type === `${shift}_checkout`)
          ) {
            scanType = `${shift}_checkout`;
          } else if (
            !shiftScansResult.some((scan) => scan.scan_type === `${shift}_checkin`)
          ) {
            scanType = `${shift}_checkin`;
          } else {
            return res.status(403).json({
              error: `You have already completed scanning for the ${shift} shift.`,
            });
          }

          // Determine the status based on the scan time
          if (scanType === "m_checkin") {
            if (scanTime.isBefore(moment("08:00", "HH:mm"))) {
              status = "Early";
            } else if (scanTime.isBetween(moment("08:00", "HH:mm"), moment("08:15", "HH:mm"))) {
              status = "On-Time";
            } else if (scanTime.isAfter(moment("09:00", "HH:mm"))) {
              status = "Absent";
            } else {
              status = "Late";
            }
          } else if (scanType === "m_checkout") {
            if (scanTime.isBefore(moment("12:00", "HH:mm"))) {
              status = "Early";
            } else if (scanTime.isBetween(moment("12:00", "HH:mm"), moment("12:15", "HH:mm"))) {
              status = "On-Time";
            } else {
              status = "Late";
            }
          } else if (scanType === "a_checkin") {
            if (scanTime.isBefore(moment("13:00", "HH:mm"))) {
              status = "Early";
            } else if (scanTime.isBetween(moment("13:00", "HH:mm"), moment("13:15", "HH:mm"))) {
              status = "On-Time";
            } else if (scanTime.isAfter(moment("15:00", "HH:mm"))) {
              status = "Absent";
            } else {
              status = "Late";
            }
          } else if (scanType === "a_checkout") {
            if (scanTime.isBefore(moment("17:00", "HH:mm"))) {
              status = "Early";
            } else if (scanTime.isBetween(moment("17:00", "HH:mm"), moment("17:15", "HH:mm"))) {
              status = "On-Time";
            } else {
              status = "Late";
            }
          }
        }
      }

      // Ensure scanType is always defined before inserting
      if (!scanType) {
        return res.status(400).json({
          error: "Unable to determine the scan type. Please try again later.",
        });

      }

      // Prevent multiple check-ins at the same time
      const existingCheckinQuery = `
        SELECT scan_type 
        FROM tbl_attendance_scan 
        WHERE attendance_id = ? AND scan_type = ? AND DATE(scan_time) = ?
      `;
      const [existingCheckinResult] = await con.query(existingCheckinQuery, [attendanceId, scanType, date]);
      if (existingCheckinResult.length > 0) {
        return res.status(403).json({
          error: `You have already performed ${scanType} for today.`,
        });
      }

      // Send HR alerts for Late or Absent scans
      if (status === "Late" || status === "Absent") {
        const userQuery = `
          SELECT 
            u.first_name, 
            u.last_name, 
            u.username, 
            u.phone_number, 
            p.position_name,
            d.department_name
          FROM tbl_user u
          LEFT JOIN tbl_position p ON u.position_id = p.position_id
          LEFT JOIN tbl_department d ON p.department_id = d.department_id
          WHERE u.user_id = ?
        `;
        const [userResult] = await con.query(userQuery, [user_id]);
        if (userResult.length > 0) {
          const user = userResult[0];
          const hrAlertMessage = `
            🚨 Attendance Alert:
            User: ${user.first_name} ${user.last_name} (${user.username})
            Phone: ${user.phone_number}
            Department: ${user.department_name}
            Position: ${user.position_name}
            Shift: ${shift === "ot" ? "Overtime" : shift === "m" ? "Morning" : "Afternoon"}
            Status: ${status}
            Time: ${timeString}
          `;
          await sendHRAlert(hrAlertMessage);
        }
      }

      const formattedScanTime = scanTime.format("YYYY-MM-DD HH:mm:ss");
      const insertScanQuery = `
        INSERT INTO tbl_attendance_scan 
        (attendance_id, scan_type, scan_time, status) 
        VALUES (?, ?, ?, ?)
      `;
      await con.query(insertScanQuery, [attendanceId, scanType, timeFormat, status]);

      return res.json({
        message: `Scanned successfully for ${scanType}.`,
        scanTime: formattedScanTime,
        status,
        scanType,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "An error occurred while processing your request" });
    }
  }
};
const generateQR = async (req, res) => {
  const code = Math.random().toString(36).substring(7); // Generate a random code
  const expiresAt = new Date(Date.now() + 4 * 365 * 24 * 60 * 60 * 1000); // Expires in 4 years
  try {
    // Data for third-party apps (URL)
    const baseUrl = "https://www.copebeta.site/api/scanQr";
    const qrDataForThirdParty = `${baseUrl}?code=${code}`;
    // Data for system scanning (structured JSON)
    const qrDataForSystem = JSON.stringify({ code, expiresAt });
    // Generate QR code image with the URL (for third-party apps)
    const qrImage = await QRCode.toDataURL(qrDataForThirdParty);
    // Store the QR code and image URL in the database
    await con.query(
      "INSERT INTO tbl_qrcode (code, expired_at, qr_image) VALUES (?, ?, ?)",
      [code, expiresAt, qrImage]
    );
    res.json({ qrImage, code, url: qrDataForThirdParty, qrDataForSystem });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate QR code" });
  }
};

module.exports = { generateQR, scanQR };