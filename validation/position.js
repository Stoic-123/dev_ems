const Joi = require('joi');

const createPositionSchema = Joi.object({
    department_id: Joi.number().integer().positive().required().messages({
      "number.base": "Department ID must be a number",
      "number.integer": "Department ID must be an integer",
      "number.positive": "Department ID must be a positive number",
      "any.required": "Department ID is required"
    }),
    position_name: Joi.string().max(100).required().messages({
      "string.empty": "Position name is required",
      "string.max": "Position name must be less than or equal to 100 characters",
      "any.required": "Position name is required"
    }),
    description: Joi.string().allow("", null).optional().messages({
      "string.base": "Description must be a string"
    })
});

const updatePositionSchema = Joi.object({
  params: Joi.object({
    position_id: Joi.number().integer().positive().required().messages({
      "number.base": "Position ID must be a number",
      "number.integer": "Position ID must be an integer",
      "number.positive": "Position ID must be a positive number",
      "any.required": "Position ID is required"
    })
  }),
  body: Joi.object({
    description: Joi.string().allow("").optional()
  })
});

const getPositionByNameSchema = Joi.object({
    position_name: Joi.string().required().messages({
        "string.empty": "Position name is required",
        "any.required": "Position name is required"
    }),
    status: Joi.string().valid('Active', 'Inactive').messages({
        "string.empty": "Status cannot be empty",
        "any.only": "Status must be either 'Active' or 'Inactive'"
    })
});

const getPositionByIdSchema = Joi.object({
    position_id: Joi.number().integer().positive().required().messages({
      "number.base": "Position ID must be a number",
      "number.integer": "Position ID must be an integer",
      "number.positive": "Position ID must be a positive number",
      "any.required": "Position ID is required"
    }),
  });

const deletePositionSchema = Joi.object({
  position_id: Joi.number().integer().positive().required().messages({
    "number.base": "Position ID must be a number",
    "number.integer": "Position ID must be an integer",
    "number.positive": "Position ID must be a positive number",
    "any.required": "Position ID is required"
  })
});

const activatePositionSchema = Joi.object({
  position_id: Joi.number().integer().required().messages({
    "number.base": "Position ID must be a number",
    "any.required": "Position ID is required"
  })
});

const getPositionStatusSchema = Joi.object({
    status: Joi.string().valid('Active', 'Inactive').messages({
        "string.empty": "Status cannot be empty",
        "any.required": "Status is required",
        "any.only": "Status must be either 'Active' or 'Inactive'"
    })
});

const validator = (schema) => (payload) => schema.validate(payload, { abortEarly: false });

module.exports = {
  validator,
  schemas: {
    createPosition: createPositionSchema,
    updatePosition: updatePositionSchema,
    getPositionByName: getPositionByNameSchema,
    getPositionById: getPositionByIdSchema,
    deletePosition: deletePositionSchema,
    activatePosition: activatePositionSchema,
    getPositionStatus: getPositionStatusSchema
  }
};