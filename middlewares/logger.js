const winston = require("winston");
const path = require("path");

// 🛑 Winston Logger Create Karna
const logger = winston.createLogger({
  level: "info", // Logging Level (error, warn, info, http, debug)
  format: winston.format.combine(
    winston.format.timestamp(), // 🕒 Time Stamp add karega
    winston.format.printf(({ level, message, timestamp }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports: [
    // 🔵 Console me sirf "important" logs print karenge
    new winston.transports.Console({
      level: "info", // Sirf info aur upar wale logs console me dikhenge
      format: winston.format.colorize({ all: true }), // Colored Output
    }),

    // 🟢 Errors aur logs ko file me save karna
    new winston.transports.File({
      filename: path.join(__dirname, "logs", "errors.log"), // Errors ko alag file me
      level: "error", // Sirf "error" level ke logs isme save honge
    }),

    new winston.transports.File({
      filename: path.join(__dirname, "logs", "combined.log"), // Sab logs yahan save honge
    }),
  ],
});

// 🟠 Production Mode me Console Logging Disable Karna
if (process.env.NODE_ENV === "production") {
  logger.remove(new winston.transports.Console());
}

module.exports = logger;


// default erro handelr
// const logger = require("./logger");

// app.use((err, req, res, next) => {
    // logger.error(
    //     `🚨 ERROR: ${err.message} | Status: ${err.status || 500} | Route: ${req.method} ${req.originalUrl} | IP: ${req.ip}`,
    //     { stack: err.stack }
    //   );

//   const statusCode = err.status || 500;
//   res.status(statusCode).json({ error: "Something went wrong!" });
// });
