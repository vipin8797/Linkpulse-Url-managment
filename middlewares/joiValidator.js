

const Joi = require("joi");
const logger = require("./logger");

// Joi Validation Middleware
const validateInput = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      // 🔴 Validation fail hone par error log
      const errorDetails = error.details.map((err) => err.message).join(", ");
      logger.error(`Validation failed: ${errorDetails}`, {
        endpoint: req.path,
        method: req.method,
        body: req.body,
      });
      return res.status(400).json({ error: "Validation failed", details: errorDetails });
    }

    // ✅ Validation success hone par info log
    logger.info(`Input validated successfully for ${req.path}`, {
      method: req.method,
      body: value,
    });
    req.validatedBody = value; // Validated data ko aage pass karna
    next();
  };
};

module.exports = validateInput;