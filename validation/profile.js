const Joi = require('joi');

const userIdSchema = Joi.object({
    user_id: Joi.number().integer().positive().required().messages({
        "number.base": "User ID must be a number",
        "number.integer": "User ID must be an integer",
        "number.positive": "User ID must be a positive number",
        "any.required": "User ID is required"
    })
});

const updateEmployeeEmailSchema = Joi.object({
    user_id: Joi.number().integer().positive().required().messages({
        "number.base": "User ID must be a number",
        "number.integer": "User ID must be an integer",
        "number.positive": "User ID must be a positive number",
        "any.required": "User ID is required"
    }),
    email: Joi.string().email().required().messages({
        "string.email": "Invalid email format",
        "any.required": "Email is required"
    })
});

const validator = (schema) => (payload) => schema.validate(payload, { abortEarly: false });

module.exports = {
    validator,
    schemas: {
        userId: userIdSchema,
        updateEmployeeEmail: updateEmployeeEmailSchema
    }
};
