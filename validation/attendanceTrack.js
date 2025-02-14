const Joi = require('joi');

const getAttendanceRecordSchema = Joi.object({
    date: Joi.date().iso().required()
});


const validator = (schema) => (payload) => schema.validate(payload, { abortEarly: false });

module.exports = {
    validator,
    schemas: {
        getAttendanceRecord: getAttendanceRecordSchema
    }
};
