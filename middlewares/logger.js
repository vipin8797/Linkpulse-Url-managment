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



// //Server Startup
//    // ✅ Server start hone ka info log
// logger.info("Server started on port 8080");

// // ⚠️ Config warning jab environment variable miss ho
// logger.warn("Environment variable DATABASE_URL not set, using default");

// // 🔴 Server start fail hone ka error
// logger.error("Failed to start server: Port already in use");



// //User Authentication

// // ✅ Server start hone ka info log
// logger.info("Server started on port 8080");

// // ⚠️ Config warning jab environment variable miss ho
// logger.warn("Environment variable DATABASE_URL not set, using default");

// // 🔴 Server start fail hone ka error
// logger.error("Failed to start server: Port already in use");



// //Database operations
// // ✅ Database connection successful
// logger.info("Connected to MongoDB database");

// // ⚠️ Slow query warning
// logger.warn("Database query took longer than expected", { query: "SELECT * FROM users", time: "1500ms" });

// // 🔴 Database connection failed
// logger.error("Failed to connect to database: Connection timeout", { host: "localhost:27017" });

// // 🔥 Error with stack trace
// try {
//   throw new Error("Invalid database query");
// } catch (err) {
//   logger.error(`Database error: ${err.message}`, { stack: err.stack, query: "SELECT * FROM nonexistent_table" });
// }




// //api Callse
// // ✅ API request successful
// logger.info("API request completed", { endpoint: "/api/users", method: "GET", status: 200 });

// // ⚠️ Rate limit warning
// logger.warn("User approaching rate limit", { userId: "12345", requests: 95, limit: 100 });

// // 🔴 API request failed
// logger.error("API request failed due to invalid input", { endpoint: "/api/users", method: "POST", status: 400 });

// // 🐛 Debugging request payload (development only)
// logger.debug("Request payload received", { endpoint: "/api/users", payload: { name: "Vipin", age: 25 } });



// //FIle operations
// // ✅ File upload successful
// logger.info("File uploaded successfully", { filename: "image.jpg", size: "2MB" });

// // ⚠️ File size warning
// logger.warn("File size exceeds recommended limit", { filename: "largefile.zip", size: "50MB" });

// // 🔴 File read error
// logger.error("Failed to read file: Permission denied", { filepath: "/uploads/secret.txt" });


// //BackgroundJ Jobs
// // ✅ Job completed
// logger.info("Scheduled job completed", { jobName: "sendEmail", duration: "120s" });

// // ⚠️ Job delayed
// logger.warn("Job execution delayed due to high load", { jobName: "processImages", delay: "300s" });

// // 🔴 Job failed
// logger.error("Job failed: Invalid configuration", { jobName: "backupDatabase" });



// //Security Events

// // ✅ Security check passed
// logger.info("User passed security check", { userId: "12345", check: "2FA" });

// // ⚠️ Suspicious activity
// logger.warn("Multiple login attempts detected", { ip: "192.168.1.1", attempts: 10 });

// // 🔴 Security breach attempt
// logger.error("Unauthorized access attempt", { endpoint: "/admin", ip: "192.168.1.1" });


// //Custom Scenario
// // ✅ Feature toggle enabled
// logger.info("New feature enabled", { feature: "darkMode", enabledAt: "2025-03-22" });

// // ⚠️ Deprecated function usage
// logger.warn("Deprecated function called", { function: "oldLogin()", alternative: "newLogin()" });

// // 🔴 Critical system failure
// logger.error("System failure: Out of memory", { memoryUsed: "95%", max: "100%" });

// // 🔥 Exception with metadata
// try {
//   nullReference.someMethod();
// } catch (err) {
//   logger.error(`Runtime error: ${err.message}`, { 
//     stack: err.stack, 
//     context: "Processing user request", 
//     userId: "12345" 
//   });
// }