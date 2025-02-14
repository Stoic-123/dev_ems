const moment = require('moment');

const formatWorkTime = (timeString) => {
    if (!timeString) return null; 

    const duration = moment.duration(timeString);

    const hours = duration.hours();
    const minutes = duration.minutes();

    return `${hours}h ${minutes}m`;
};

const sumWorkTime = (m_workTime, a_workTime) => {
    const m_duration = moment.duration(m_workTime);
    const a_duration = moment.duration(a_workTime);

    const totalDuration = moment.duration(m_duration).add(a_duration);

    const hours = totalDuration.hours();
    const minutes = totalDuration.minutes();

    return `${hours}h ${minutes}m`;
};

module.exports = {
    formatWorkTime,
    sumWorkTime
};