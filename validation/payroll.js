const Joi = require('joi');

const updatedPayrollStatusSchema = Joi.object({
    user_id : Joi.string().required(),
    status : Joi.string().required(),
});

const validator = (schema) => (payload) => schema.validate(payload, { abortEarly: false });
module.exports = {
    validator,
    schemas: {
        updatedPayrollStatus: updatedPayrollStatusSchema
    }
};


