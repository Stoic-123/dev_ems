const moment = require('moment');

const { formatWorkTime, sumWorkTime } = require('../utils/workTime');

const formatPersonalAttResponse = (record) => {
    const formatTime = (time) => {
        return time ? moment(time).format('HH:mm:ss') : '-';
    };

    const formatDisplayTime = (time) => {
        return time ? moment(time).format('hh:mm A') : '-';
    };

    return {
        summary: {
            date: {
                default_date: moment(record.date).format('DD-MMM-YYYY'),
                format_date: moment(record.date).format('dddd, DD-MMM-YYYY'),
                format_day: moment(record.date).format('dddd, DD')
            },
            total: {
                total_workTime: sumWorkTime(record.m_work_time, record.a_work_time),
                m_workTime: formatWorkTime(record.m_work_time),
                breakTime: formatWorkTime(record.break_time),
                a_workTime: formatWorkTime(record.a_work_time)
            },
            status: {
                m_status: record.m_shift_status,
                a_status: record.a_shift_status,
                day_status: record.day_status
            }
        },
        morning: {
            checkIn: {
                time: formatTime(record.m_checkin_time),
                format_time: formatDisplayTime(record.m_checkin_time),
                status: record.m_checkin_status
            },
            checkOut: {
                time: formatTime(record.m_checkout_time),
                formatTime: formatDisplayTime(record.m_checkout_time),
                status: record.m_checkout_status
            }
        },
        afternoon: {
            checkIn: {
                time: formatTime(record.a_checkin_time),
                formatTime: formatDisplayTime(record.a_checkin_time),
                status: record.a_checkin_status
            },
            checkOut: {
                time: formatTime(record.a_checkout_time),
                formatTime: formatDisplayTime(record.a_checkout_time),
                status: record.a_checkout_status
            }
        }
    };
}

const processAttendanceData = (startDate, endDate, attendanceResults) => {
    const records = {};
    let curDate = moment(startDate);
    const endMoment = moment(endDate);
    const today = moment().startOf('day');
    
    const effectiveEndDate = endMoment.isAfter(today) ? today : endMoment;

    while (curDate <= effectiveEndDate) {
        const dateStr = curDate.format('YYYY-MM-DD');
        records[dateStr] = {
            date: dateStr,
            m_checkin_time: null,
            m_checkin_status: 'Absent',
            m_checkout_time: null,
            m_checkout_status: null,
            a_checkin_time: null,
            a_checkin_status: 'Absent',
            a_checkout_time: null,
            a_checkout_status: null,
            m_work_time: null,
            break_time: null,
            a_work_time: null,
            m_shift_status: 'Absent',
            a_shift_status: 'Absent',
            day_status: 'Absent'
        };
        curDate.add(1, 'days');
    }

    attendanceResults.forEach(record => {
        records[moment(record.date).format('YYYY-MM-DD')] = record;
    });

    return Object.values(records).sort((a, b) => moment(b.date).diff(moment(a.date)));
}

const formatPersonalAttStatResponse = (record, totalDaysInRange, start_date, end_date) => {
    const untrackedDays = totalDaysInRange - record.total_days;

    return {
        dateRange: {
            start: start_date,
            end: end_date,
            totalDays: totalDaysInRange,
        },
        stats: {
            morning: {
                checkIn: {
                    early: Number(record.m_checkin_early),
                    ontime: Number(record.m_checkin_ontime),
                    late: Number(record.m_checkin_late),
                    absent: Number(record.m_checkin_absent)
                },
                checkOut: {
                    early: Number(record.m_checkout_early),
                    ontime: Number(record.m_checkout_ontime),
                    late: Number(record.m_checkout_late)
                },
            },
            afternoon: {
                checkIn: {
                    early: Number(record.a_checkin_early),
                    ontime: Number(record.a_checkin_ontime),
                    late: Number(record.a_checkin_late),
                    absent: Number(record.a_checkin_absent)
                },
                checkOut: {
                    early: Number(record.a_checkout_early),
                    ontime: Number(record.a_checkout_ontime),
                    late: Number(record.a_checkout_late)
                },
            },
            shifts: {
                morning: {
                    present: Number(record.m_shift_present),
                    absent: Number(record.m_shift_absent) + untrackedDays,
                    late: Number(record.m_shift_late)
                },
                afternoon: {
                    present: Number(record.a_shift_present),
                    absent: Number(record.a_shift_absent) + untrackedDays,
                    late: Number(record.a_shift_late)
                },
            },
            overall: {
                present: Number(record.day_present),
                absent: Number(record.day_absent) + untrackedDays,
                late: Number(record.day_late),
                partial: Number(record.day_partial)
            },
        },
    }
}

const formatComparisonResponse = (cur, prev) => {
    return {
        dateRange: {
            totalDays: cur.dateRange.totalDays - prev.dateRange.totalDays
        },
        stats: {
            morning: {
                checkIn: {
                    early: cur.stats.morning.checkIn.early - prev.stats.morning.checkIn.early,
                    ontime: cur.stats.morning.checkIn.ontime - prev.stats.morning.checkIn.ontime,
                    late: cur.stats.morning.checkIn.late - prev.stats.morning.checkIn.late,
                    absent: cur.stats.morning.checkIn.absent - prev.stats.morning.checkIn.absent
                },
                checkOut: {
                    early: cur.stats.morning.checkOut.early - prev.stats.morning.checkOut.early,
                    ontime: cur.stats.morning.checkOut.ontime - prev.stats.morning.checkOut.ontime,
                    late: cur.stats.morning.checkOut.late - prev.stats.morning.checkOut.late
                }
            },
            afternoon: {
                checkIn: {
                    early: cur.stats.afternoon.checkIn.early - prev.stats.afternoon.checkIn.early,
                    ontime: cur.stats.afternoon.checkIn.ontime - prev.stats.afternoon.checkIn.ontime,
                    late: cur.stats.afternoon.checkIn.late - prev.stats.afternoon.checkIn.late,
                    absent: cur.stats.afternoon.checkIn.absent - prev.stats.afternoon.checkIn.absent
                },
                checkOut: {
                    early: cur.stats.afternoon.checkOut.early - prev.stats.afternoon.checkOut.early,
                    ontime: cur.stats.afternoon.checkOut.ontime - prev.stats.afternoon.checkOut.ontime,
                    late: cur.stats.afternoon.checkOut.late - prev.stats.afternoon.checkOut.late
                }
            },
            shifts: {
                morning: {
                    present: cur.stats.shifts.morning.present - prev.stats.shifts.morning.present,
                    absent: cur.stats.shifts.morning.absent - prev.stats.shifts.morning.absent,
                    late: cur.stats.shifts.morning.late - prev.stats.shifts.morning.late
                },
                afternoon: {
                    present: cur.stats.shifts.afternoon.present - prev.stats.shifts.afternoon.present,
                    absent: cur.stats.shifts.afternoon.absent - prev.stats.shifts.afternoon.absent,
                    late: cur.stats.shifts.afternoon.late - prev.stats.shifts.afternoon.late
                }
            },
            overall: {
                present: cur.stats.overall.present - prev.stats.overall.present,
                absent: cur.stats.overall.absent - prev.stats.overall.absent,
                late: cur.stats.overall.late - prev.stats.overall.late,
                partial: cur.stats.overall.partial - prev.stats.overall.partial
            }
        }
    }
}

module.exports = {
    formatPersonalAttResponse, formatPersonalAttStatResponse, processAttendanceData, formatComparisonResponse
};