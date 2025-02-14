const moment = require('moment');

const combineDateTime = (date, time) => {
    if (!time) return null; 
    const combined = moment(`${date} ${time}`, "YYYY-MM-DD h:mm A");
    if (!combined.isValid()) throw new Error(`Invalid date/time combination: ${date}, ${time}`);
    return combined.format("YYYY-MM-DD HH:mm:ss"); 
}

module.exports = {
    combineDateTime
}