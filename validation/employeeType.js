const Joi = require('joi');

const createEmpTypeSchema = Joi.object({
    employee_type : Joi.string().required()
});

const validator = (schema) => (payload) => schema.validate(payload, { abortEarly: false });

module.exports = {
    validator,
    schemas: {
        createEmpType: createEmpTypeSchema
    }
};
