const Joi = require('joi');
const moment = require('moment');

const { validateDate } = require('../utils/dateHelper');

const getPersonalAttendanceSchema = Joi.object({
    emp_id: Joi.number().integer().positive().optional(),
    start_date: Joi.string().required().custom(validateDate),
    end_date: Joi.string().required().custom(validateDate)
}).custom((value, helpers) => {
    let start = moment(value.start_date, 'YYYY-MM-DD');
    let end = moment(value.end_date, 'YYYY-MM-DD');
    
    if (start.isAfter(end)) {
        [start, end] = [end, start]; 
        return { ...value, start_date: start.format('YYYY-MM-DD'), end_date: end.format('YYYY-MM-DD') };
    }
    
    return value;
});

const getPersonalAttendanceTodaySchema = Joi.object({
    user_id: Joi.number().integer().positive().required()
});

const validator = (schema) => (payload) => schema.validate(payload, { abortEarly: false });

module.exports = {
    validator,
    schemas: {
        getPersonalAttendance: getPersonalAttendanceSchema,
        getPersonalAttendanceToday: getPersonalAttendanceTodaySchema
    }
};
