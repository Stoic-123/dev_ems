const moment = require('moment');

const determineStatus = (scanTime, scanType) => {
    const scanMoment = moment(scanTime);

    const getMoment = (hour, minute) => moment(scanMoment).set({ hour, minute, second: 0, millisecond: 0 });

    const isBetween = (start, end) => scanMoment.isBetween(start, end, null, "[)");

    switch(scanType) {
        case "m_checkin":
            if (isBetween(getMoment(7, 30), getMoment(8, 0))) return "Early";
            if (isBetween(getMoment(8, 0), getMoment(8, 15))) return "On-Time";
            if (scanMoment.isAfter(getMoment(9, 0))) return "Absent";
            return "Late";

        case "a_checkin":
            if (isBetween(getMoment(12, 45), getMoment(13, 0))) return "Early";
            if (isBetween(getMoment(13, 0), getMoment(13, 15))) return "On-Time";
            if (scanMoment.isAfter(getMoment(14, 0))) return "Absent";
            return "Late";

        case "m_checkout":
            if (scanMoment.isBefore(getMoment(12, 0))) return "Early";
            if (isBetween(getMoment(12, 0), getMoment(12, 15))) return "On-Time";
            return "Late";

        case "a_checkout":
            if (scanMoment.isBefore(getMoment(17, 0))) return "Early";
            if (isBetween(getMoment(17, 0), getMoment(17, 15))) return "On-Time";
            return "Late";

        default:
            return "Invalid scan type";
    }
};

module.exports = {
    determineStatus
};
