const Joi = require('joi');

const { validateDate } = require('../utils/dateHelper');

const postRequestLeaveSchema = Joi.object({
    start_date : Joi.string().required().custom(validateDate),
    end_date: Joi.string().required().custom(validateDate),
    partial_day: Joi.string().valid('Morning', 'Afternoon').optional(),
    leave_type_id: Joi.number().integer().positive().required(),
    reason: Joi.string().required(),
}).custom((value, helpers) => {
    if (value.start_date === value.end_date && !value.partial_day) {
        return value;
    } else if (value.partial_day && value.start_date !== value.end_date) {
        return helpers.error('any.invalid');
    }
    return value;
});

const validator = (schema) => (payload) => schema.validate(payload, { abortEarly: false });
module.exports = {
    validator,
    schemas: {
        postRequestLeave: postRequestLeaveSchema
    }
};


