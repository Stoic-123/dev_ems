const Joi = require('joi');

const postUserStatuseSchema = Joi.object({
    status_name : Joi.string().required(),
});

const validator = (schema) => (payload) => schema.validate(payload, { abortEarly: false });
module.exports = {
    validator,
    schemas: {
        postUserStatuse: postUserStatuseSchema
    }

};


