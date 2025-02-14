const moment = require('moment');

const { formatWorkTime, sumWorkTime } = require('../utils/workTime');

const formatAttResponse = (record) => {
    return {
        user: {
            id: record.user_id,
            firstName: record.first_name,
            lastName: record.last_name,
            fullName: record.fullname,
            username: record.username,
            employeeCode: record.employee_code,
            avatar: record.avatar,
        },
        attendance: {
            morning: {
                checkIn: {
                    time: moment(record.m_checkin_time).format('HH:mm:ss'),
                    format_time: moment(record.m_checkin_time).format('hh:mm A'),
                    status: record.m_checkin_status
                },
                checkOut: {
                    time: moment(record.m_checkout_time).format('HH:mm:ss'),
                    format_time: moment(record.m_checkout_time).format('hh:mm A'),
                    status: record.m_checkout_status
                },
                workTime: formatWorkTime(record.m_work_time)
            },
            afternoon: {
                checkIn: {
                    time: moment(record.a_checkin_time).format('HH:mm:ss'),
                    format_time: moment(record.a_checkin_time).format('hh:mm A'),
                    status: record.a_checkin_status
                },
                checkOut: {
                    time: moment(record.m_checkout_time).format('HH:mm:ss'),
                    format_time: moment(record.a_checkout_time).format('hh:mm A'),
                    status: record.a_checkout_status
                },
                workTime: formatWorkTime(record.a_work_time)
            },
            totalWorkTime: sumWorkTime(record.m_work_time, record.a_work_time)
        },
    }
}

module.exports = {
    formatAttResponse,
};