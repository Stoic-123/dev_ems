const Joi = require('joi');

const loginSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required()
});

const resetPasswordSchema = Joi.object({
    username: Joi.string().required()
});

const changePasswordSchema = Joi.object({
    user_id: Joi.number().integer().min(1).required(),
    current_password: Joi.string().required(),
    new_password: Joi.string().required()
});

const getUserSchema = Joi.object({
    id: Joi.number().integer().min(1).required(),
    token_version: Joi.number().integer().required(),
});

const validator = (schema) => (payload) => schema.validate(payload, { abortEarly: false });

module.exports = {
    validator,
    schemas: {
        login: loginSchema,
        resetPassword: resetPasswordSchema,
        changePassword: changePasswordSchema,
        getUser: getUserSchema
    }
};
