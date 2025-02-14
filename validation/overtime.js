const Joi = require("joi");

const overtimeValidationSchema = Joi.object({
    request_date: Joi.date().required(),
    reason: Joi.string().max(255).optional(),
    overtime_type: Joi.string().max(255).required(),
    start_time: Joi.string()
        .pattern(/^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i)
        .required()
        .messages({
            "string.pattern.base": "Start time must be in hh:mm AM/PM format.",
        }),
    end_time: Joi.string()
        .pattern(/^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i)
        .required()
        .messages({
            "string.pattern.base": "End time must be in hh:mm AM/PM format.",
        }),
});

const validateOvertimeRequest = (data) => {
    return overtimeValidationSchema.validate(data, { abortEarly: false });
};

module.exports = { validateOvertimeRequest };