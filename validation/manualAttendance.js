const Joi = require('joi');
const moment = require('moment');

const { validateDate } = require('../utils/dateHelper')

const validateScanTime = (value, helpers) => {
    const scanMoment = moment(value, "h:mm A", true); 
    if (!scanMoment.isValid()) {
        return helpers.error("any.invalid", { value });
    }
    return value;
};

const addAttendanceSchema = Joi.object({
    user_id: Joi.number().integer().positive().required(),
    date: Joi.string().required().custom(validateDate),
    m_checkin: Joi.string().allow(null, "").custom(validateScanTime).optional(),
    m_checkout: Joi.string().allow(null, "").custom(validateScanTime).optional(),
    a_checkin: Joi.string().allow(null, "").custom(validateScanTime).optional(),
    a_checkout: Joi.string().allow(null, "").custom(validateScanTime).optional()
}).or('m_checkin', 'm_checkout', 'a_checkin', 'a_checkout');

const validator = (schema) => (payload) => schema.validate(payload, { abortEarly: false });

module.exports = {
    validator,
    schemas: {
        addAttendance: addAttendanceSchema
    }
};
