const Joi = require("joi");

const createDepartmentSchema = Joi.object({
  department_name: Joi.string().required().messages({
    "string.empty": "Department name is required",
    "any.required": "Department name is required",
  }),
  description: Joi.string().allow("").optional(), 
  manager_id: Joi.number().allow("").integer().positive().optional().messages({
    "number.base": "Manager ID must be a number",
    "number.integer": "Manager ID must be an integer",
    "number.positive": "Manager ID must be a positive number",
  }),
});

const getDepartmentByIdSchema = Joi.object({
  department_id: Joi.number().integer().positive().required().messages({
    "number.base": "Department ID must be a number",
    "number.integer": "Department ID must be an integer",
    "number.positive": "Department ID must be a positive number",
    "any.required": "Department ID is required",
  }),
});

const updateDepartmentSchema = Joi.object({
  params: Joi.object({
    department_id: Joi.number().integer().positive().required().messages({
      "number.base": "Department ID must be a number",
      "number.integer": "Department ID must be an integer",
      "number.positive": "Department ID must be a positive number",
      "any.required": "Department ID is required"
    })
  }),
  body: Joi.object({
    description: Joi.string().allow("").optional(),
    manager_id: Joi.number().integer().positive().optional().messages({
      "number.base": "Manager ID must be a number",
      "number.integer": "Manager ID must be an integer",
      "number.positive": "Manager ID must be a positive number"
    })
  })
});

const deleteDepartmentSchema = Joi.object({
  department_id: Joi.number().integer().required().messages({
    "number.base": "Department ID must be a number",
    "any.required": "Department ID is required"
  })
});

const activateDepartmentSchema = Joi.object({
  department_id: Joi.number().integer().required().messages({
    "number.base": "Department ID must be a number",
    "any.required": "Department ID is required"
  }),
  positions: Joi.array().items(Joi.number().integer()).optional().messages({
    "array.base": "\"positions\" must be an array",
    "array.includes": "\"positions\" should contain only numbers"
  })
});

const getDepartmentByNameSchema = Joi.object({
  department_name: Joi.string().required().messages({
      "string.empty": "Department name cannot be empty",
      "any.required": "Department name is required"
  }),
  status: Joi.string().valid('Active', 'Inactive').messages({
      "string.empty": "Status cannot be empty",
      "any.only": "Status must be either 'Active' or 'Inactive'"
  })
});

const getDepartmentStatusSchema = Joi.object({
  status: Joi.string().valid('Active', 'Inactive').messages({
      "string.empty": "Status cannot be empty",
      "any.required": "Status is required",
      "any.only": "Status must be either 'Active' or 'Inactive'"
  })
});

const assignManagerSchema = Joi.object({
  params: Joi.object({
    department_id: Joi.number().integer().positive().required().messages({
      "number.base": "Department ID must be a number",
      "number.integer": "Department ID must be an integer",
      "number.positive": "Department ID must be a positive number",
      "any.required": "Department ID is required"
    })
  }),
  body: Joi.object({
    user_id: Joi.number().integer().positive().required().messages({
      "number.base": "User ID must be a number",
      "any.required": "User ID is required"
    })
  })
});

const removeManagerSchema = Joi.object({
  department_id: Joi.number().integer().positive().required().messages({
    "number.base": "Department ID must be a number",
    "any.required": "Department ID is required",
  }),
});

const validator = (schema) => (payload) => schema.validate(payload, { abortEarly: false });

module.exports = {
  validator,
  schemas: {
    createDepartment: createDepartmentSchema,
    getDepartmentStatus: getDepartmentStatusSchema,
    getDepartmentById: getDepartmentByIdSchema,
    updateDepartment: updateDepartmentSchema,
    deleteDepartment: deleteDepartmentSchema,
    activateDepartment: activateDepartmentSchema,
    getDepartmentByName: getDepartmentByNameSchema,
    assignManager: assignManagerSchema,
    removeManager: removeManagerSchema,
  },
};