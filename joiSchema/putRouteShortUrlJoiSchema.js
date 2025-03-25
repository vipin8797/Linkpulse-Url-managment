const Joi = require('joi');

const EditshortUrlJoiSchema = Joi.object({
  url: Joi.object({
    originalUrl: Joi.string()
      .uri({ scheme: ['http', 'https'] }) // Must be a valid URL
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
      .optional()
      .allow('', null)
      .valid('', '1d', '2d', '3d', '1w', '2w', '1m') // Match form options
      .messages({
        'any.only': 'Expiration date must be one of: No Expiry, 1 Day, 2 Days, 3 Days, 1 Week, 2 Weeks, 1 Month',
      }),
    generateQR: Joi.string()
      .optional()
      .allow('', null)
      .valid('true', 'false') // Optional field from previous request
      .messages({
        'any.only': 'Generate QR must be either "true" or "false"',
      }),
  }).required(), // `url` object is required in req.body
});


module.exports = EditshortUrlJoiSchema;