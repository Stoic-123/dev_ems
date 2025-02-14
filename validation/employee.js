const Joi = require('joi');

const { validateDate, validateAge, validateHireDate,  } = require('../utils/dateHelper');

const createEmployeeSchema = Joi.object({
    role_id: Joi.number().integer().min(1).positive().required().messages({
        "number.base": "Role ID must be a number",
        "number.integer": "Role ID must be an integer",
        "number.min": "Role ID must be at least 1",
        "number.positive": "Role ID must be a positive number",
        "any.required": "Role ID is required"
    }),
    position_id: Joi.number().integer().min(1).required().messages({
        "number.base": "Position ID must be a number",
        "number.integer": "Position ID must be an integer",
        "number.min": "Position ID must be at least 1",
        "any.required": "Position ID is required"
    }),
    employee_type_id: Joi.number().integer().min(1).positive().required().messages({
        "number.base": "Employee Type ID must be a number",
        "number.integer": "Employee Type ID must be an integer",
        "number.min": "Employee Type ID must be at least 1",
        "number.positive": "Employee Type ID must be a positive number",
        "any.required": "Employee Type ID is required"
    }),
    first_name: Joi.string().pattern(/^[A-Za-z]+$/).required().messages({
        "string.base": "First name must be a string",
        "string.pattern.base": "First name can only contain alphabetic characters",
        "any.required": "First name is required"
    }),
    last_name: Joi.string().pattern(/^[A-Za-z]+$/).required().messages({
        "string.base": "Last name must be a string",
        "string.pattern.base": "Last name can only contain alphabetic characters",
        "any.required": "Last name is required"
    }),
    dob: Joi.string().required().custom((value, helper) => validateAge(value, helper)).messages({
        "string.base": "Date of birth must be a valid string",
        "any.required": "Date of birth is required"
    }),
    gender: Joi.string().valid('Male', 'Female', 'Other').required().messages({
        "string.base": "Gender must be a string",
        "any.only": "Gender must be one of Male, Female, or Other",
        "any.required": "Gender is required"
    }),
    address: Joi.string().required().messages({
        "string.base": "Address must be a string",
        "any.required": "Address is required"
    }),
    phone_number: Joi.string().pattern(/^\+([1-9]{1,4})\s\d{2,4}(\s\d{3,4}){2,3}$/).required().messages({
        "string.base": "Phone number must be a string",
        "string.pattern.base": "Phone number is not valid, make sure it follows the international format",
        "any.required": "Phone number is required"
    }),
    hired_date: Joi.string().required().custom((value, helper) => validateHireDate(value, helper)).messages({
        "string.base": "Hired date must be a valid string",
        "any.required": "Hired date is required"
    }),
    basic_salary: Joi.number().precision(2).required().messages({
        "number.base": "Basic salary must be a number",
        "number.precision": "Basic salary must have at most 2 decimal places",
        "any.required": "Basic salary is required"
    })
});

const updateEmployeePersonalInfoSchema = Joi.object({
    first_name: Joi.string().pattern(/^[A-Za-z]+$/).required().messages({
        "string.base": "First name must be a string",
        "string.pattern.base": "First name can only contain alphabetic characters",
        "any.required": "First name is required"
    }),
    last_name: Joi.string().pattern(/^[A-Za-z]+$/).required().messages({
        "string.base": "Last name must be a string",
        "string.pattern.base": "Last name can only contain alphabetic characters",
        "any.required": "Last name is required"
    }),
    dob: Joi.string().required().custom((value, helper) => validateAge(value, helper)).messages({
        "string.base": "Date of birth must be a valid string",
        "any.required": "Date of birth is required"
    }),
    gender: Joi.string().valid('Male', 'Female', 'Other').required().messages({
        "string.base": "Gender must be a string",
        "any.only": "Gender must be one of Male, Female, or Other",
        "any.required": "Gender is required"
    })
});

const updateEmployeeContactInfoSchema = Joi.object({
    address: Joi.string().required().messages({
        "string.base": "Address must be a string",
        "any.required": "Address is required"
    }),
    phone_number: Joi.string().pattern(/^\+([1-9]{1,4})\s\d{2,4}(\s\d{3,4}){2,3}$/).required().messages({
        "string.base": "Phone number must be a string",
        "string.pattern.base": "Phone number is not valid, make sure it follows the international format",
        "any.required": "Phone number is required"
    })
});

const updateEmployeeEmploymentInfoSchema = Joi.object({
    position_id: Joi.number().integer().min(1).required().messages({
        "number.base": "Position ID must be a number",
        "number.integer": "Position ID must be an integer",
        "number.min": "Position ID must be at least 1",
        "any.required": "Position ID is required"
    }),
    employee_type_id: Joi.number().integer().min(1).positive().required().messages({
        "number.base": "Employee Type ID must be a number",
        "number.integer": "Employee Type ID must be an integer",
        "number.min": "Employee Type ID must be at least 1",
        "number.positive": "Employee Type ID must be a positive number",
        "any.required": "Employee Type ID is required"
    }),
    hired_date: Joi.string().required().custom((value, helper) => validateHireDate(value, helper)).messages({
        "string.base": "Hired date must be a valid string",
        "any.required": "Hired date is required"
    }),
    basic_salary: Joi.number().precision(2).required().messages({
        "number.base": "Basic salary must be a number",
        "number.precision": "Basic salary must have at most 2 decimal places",
        "any.required": "Basic salary is required"
    }),
    working_hours_per_week: Joi.number().integer().min(1).max(168).required().messages({
        "number.base": "Working hours per week must be a number",
        "number.integer": "Working hours per week must be an integer",
        "number.min": "Working hours per week must be at least 1",
        "number.max": "Working hours per week cannot exceed 168",
        "any.required": "Working hours per week is required"
    })
});

const getEmployeeNameSchema = Joi.object({
    name: Joi.string().required().messages({
        "string.empty": "name is required",
        "any.required": "name is required"
    }),
    status: Joi.string().valid('Active', 'Inactive').messages({
        "string.empty": "Status cannot be empty",
        "any.only": "Status must be either 'Active' or 'Inactive'"
    })
});

const userIdSchema = Joi.object({
    user_id: Joi.number().integer().positive().required().messages({
        "number.base": "User ID must be a number",
        "number.integer": "User ID must be an integer",
        "number.positive": "User ID must be a positive number",
        "any.required": "User ID is required"
    })
});

const getEmployeeStatusSchema = Joi.object({
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
        createEmployee: createEmployeeSchema,
        updateEmployeePersonalInfo: updateEmployeePersonalInfoSchema,
        updateEmployeeContactInfo: updateEmployeeContactInfoSchema,
        updateEmployeeEmploymentInfo: updateEmployeeEmploymentInfoSchema,
        getEmployeeName: getEmployeeNameSchema,
        userId: userIdSchema,
        getEmployeeStatus: getEmployeeStatusSchema
    }
};
