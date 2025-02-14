const Joi = require('joi');

const scanQRSchema = Joi.object({
    code: Joi.string().required(),
    user_id: Joi.number().integer().required(),
    latitude: Joi.number().required(),
    longitude: Joi.number().required()
});

const validator = (schema) => (payload) => schema.validate(payload, { abortEarly: false });

module.exports = {
    validator,
    schemas: {
        scanQR: scanQRSchema
    }
};
