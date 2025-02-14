const moment = require('moment');

const dateFormat = 'DD-MMM-YYYY';

/**
 * Validates the date format and returns the formatted date or an error message.
 * @param {string} value - The date string to validate.
 * @param {object} helper - Joi helper for validation messaging.
 * @returns {string|object} - Formatted date or error message.
 */
const validateDate = (value, helper) => {
    const date = moment(value, dateFormat, true);  // strict parsing
    if (!date.isValid()) {
        return helper.message("Invalid date format. Please use: e.g., 01-Jan-2001");
    }
    return date.format('YYYY-MM-DD'); 
};

/**
 * Validates the age (at least 18 years old) based on the date of birth.
 * @param {string} value - The date of birth to validate.
 * @param {object} helper - Joi helper for validation messaging.
 * @returns {object} - Error message or valid response.
 */
const validateAge = (value, helper) => {
    const date = moment(value, 'DD-MMM-YYYY', true); 
    if (!date.isValid()) {
        return helper.message("Invalid date format. Please use: e.g., 01-Jan-2001");
    }

    const age = moment().diff(date, 'years');
    if (age < 18) {
        return helper.message('Employee must be at least 18 years old');
    }

    return date.format('YYYY-MM-DD'); 
};

/**
 * Validates the date format and returns the formatted date or an error message.
 * @param {string} value - The date string to validate.
 * @param {object} helper - Joi helper for validation messaging.
 * @returns {string|object} - Formatted date or error message.
 */
const validateHireDate = (value, helper) => {
    const date = moment(value, dateFormat, true);  // strict parsing
    if (!date.isValid()) {
        return helper.message("Invalid date format. Please use: e.g., 01-Jan-2001");
    }

    if (date.isAfter(moment(), 'day')) {
        return helper.message("Hired date cannot exceed the current date. Please provide a valid date");
    }

    return date.format('YYYY-MM-DD'); 
};

/**
 * Determines the correct start_date and end_date based on provided query parameters.
 * @param {string} start_date - The start date from request query.
 * @param {string} end_date - The end date from request query.
 * @returns {object} - An object containing formatted start_date and end_date.
 */
const determineDateRange = (start_date, end_date) => {
    let finalStartDate, finalEndDate;

    if (start_date && !end_date) {
        const parsedStartDate = moment(start_date);
        finalStartDate = parsedStartDate.format('YYYY-MM-DD');
        finalEndDate = parsedStartDate.clone().endOf('month').format('YYYY-MM-DD');
    } else if (!start_date && end_date) {
        const parsedEndDate = moment(end_date);
        finalStartDate = parsedEndDate.clone().startOf('month').format('YYYY-MM-DD');
        finalEndDate = parsedEndDate.format('YYYY-MM-DD');
    } else if (start_date && end_date) {
        const parsedStartDate = moment(start_date);
        const parsedEndDate = moment(end_date);
        finalStartDate = parsedStartDate.format('YYYY-MM-DD');
        finalEndDate = parsedEndDate.format('YYYY-MM-DD');
    } else {
        finalStartDate = moment().startOf('month').format('YYYY-MM-DD');
        finalEndDate = moment().endOf('month').format('YYYY-MM-DD');
    }

    return { start_date: finalStartDate, end_date: finalEndDate };
};

const calculateDateRangeDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

const getPreviousDateRange = (startDate, endDate) => {
    const prevStart = moment(startDate).subtract(1, "months").format("YYYY-MM-DD");
    const prevEnd = moment(endDate).subtract(1, "months").format("YYYY-MM-DD");

    return { start_date: prevStart, end_date: prevEnd };
};

module.exports = {
    determineDateRange, validateDate, validateAge, validateHireDate, calculateDateRangeDays, getPreviousDateRange
};
