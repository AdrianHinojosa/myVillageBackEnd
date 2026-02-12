import Joi from 'joi';

/**
 * Throws a Joi validation error with a custom message
 * @param {string} message - The custom error message
 * @param {string} contextLabel - The label to associate with the context of the error
 */
export const throwJoiValidationError = (message, contextLabel) => {
    const joiError = new Joi.ValidationError(message, [{
        message,
        path: [contextLabel],
        type: 'any.invalid',
        context: { label: contextLabel }
    }], null);
    
    joiError.isJoi = true; // This property is checked by celebrate to determine if it is a Joi error
    joiError.joi = { details: [{ message, path: [contextLabel] }] }; // Include the `joi` property as required by your error handler

    throw joiError;
};