const Joi = require('joi');
const ExpressError = require('../utils/ExpressError'); // Adjust path as per your project
const logger = require('./logger'); // Assuming you have a logger

// Joi Schema 2
const shortUrlJoiSchema2 = Joi.object({
  url: Joi.object({
    originalUrl: Joi.string()
      .uri({ scheme: ['http', 'https'] })
      .trim()
      .required()
      .messages({
        'string.uri': 'Original URL must be a valid URL (http or https)',
        'any.required': 'Original URL is required',
      }),
      customDomain: Joi.string()
      .hostname() // Valid domain name (e.g., example.com)
      .optional()
      .allow('', null)
      .messages({
        'string.hostname': 'Custom domain must be a valid domain name (e.g., example.com)',
      }),
    expirationDate: Joi.string()
      .trim()
      .optional()
      .allow('', null)
      .valid('', '1d', '2d', '3d', '1w', '2w', '1m')
      .messages({
        'any.only': 'Expiration date must be one of: No Expiry, 1 Day, 2 Days, 3 Days, 1 Week, 2 Weeks, 1 Month',
      }),
    generateQR: Joi.string()
      .trim()
      .optional()
      .allow('', null)
      .valid('true', 'false')
      .messages({
        'any.only': 'Generate QR must be either "true" or "false"',
      }),
  }).required(),
});

// Middleware
const JoiValidateShortUrl2 = (req, res, next) => {
  const { error, value } = shortUrlJoiSchema2.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    // Detailed error message for logging and response
    const errorDetails = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));
    const errorMessage = 'Joi Validation failed: ' + errorDetails.map(e => `${e.field}: ${e.message}`).join(', ');

    // Log the error
    logger.error('Joi Validation failed for Short URL creation', {
      errors: errorDetails,
      requestBody: req.body,
      stack: error.stack,
    });

    // Throw ExpressError to be caught by wrapAsync or handled by default error handler
    throw new ExpressError(400, errorMessage);
  }

  // Sanitized data ko req.body mein update kar do
  req.body = value;
  next();
};

module.exports = JoiValidateShortUrl2;