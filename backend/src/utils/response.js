/**
 * Standardised API response helpers.
 * All controllers should use these for consistent response shapes.
 */

/**
 * @param {object} res - Express response object
 * @param {*} data - Response payload
 * @param {string} message - Human-readable message
 * @param {number} statusCode - HTTP status code (default 200)
 */
const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  const response = { success: true, message };
  if (data !== null) response.data = data;
  return res.status(statusCode).json(response);
};

/**
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default 400)
 * @param {*} errors - Validation errors or extra context
 */
const sendError = (res, message = 'Something went wrong', statusCode = 400, errors = null) => {
  const response = { success: false, message };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
};

module.exports = { sendSuccess, sendError };
