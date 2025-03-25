const cron = require('node-cron');
const fs = require('fs');
const ShortUrl = require('./models/shortUrlSchema'); // Adjust path
const logger = require('./middlewares/logger'); // Adjust path
const ExpressError = require('./utils/wrapAsync'); // Adjust path

function setupCronJobs(app) {
  cron.schedule('0 0 * * *', async () => {
    const now = new Date();
    const twoDaysAgo = new Date(now - 48 * 60 * 60 * 1000);

    try {
      // Step 1: Fetch documents to be deleted (to get QR code paths)
      const urlsToDelete = await ShortUrl.find({
        lastAccessedAt: { $lt: twoDaysAgo },
        isActive: true
      }).select('qrCode'); // Only fetch qrCode field for efficiency

      // Step 2: Delete associated QR code files
      for (const url of urlsToDelete) {
        const qrCodePath = url.qrCode;
        if (qrCodePath && fs.existsSync(qrCodePath)) {
          try {
            fs.unlinkSync(qrCodePath); // Delete the QR file
            logger.info(`Deleted QR code file: ${qrCodePath}`, {
              timestamp: now,
              jobName: 'deleteInactiveLinks'
            });
          } catch (deleteErr) {
            logger.warn(`Failed to delete QR code file: ${deleteErr.message}`, {
              qrCodePath,
              timestamp: now
            });
            // Continue even if file deletion fails
          }
        }
      }

      // Step 3: Delete the documents from DB
      const result = await ShortUrl.deleteMany({
        lastAccessedAt: { $lt: twoDaysAgo },
        isActive: true
      });
      logger.info(`Deleted ${result.deletedCount} inactive links`, {
        timestamp: now,
        jobName: 'deleteInactiveLinks'
      });
    } catch (err) {
      const cronError = new ExpressError(500, `Cron job failed: ${err.message}`);
      cronError.stack = err.stack;

      logger.error(
        `🚨 ERROR: ${cronError.message} | Status: ${cronError.status || 500} | Job: deleteInactiveLinks`,
        { stack: cronError.stack, timestamp: now }
      );

      app.emit('error', cronError); // Emit to app-level handler
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata'
  });

  logger.info('Cron jobs setup complete', { timestamp: new Date() });
}

module.exports = setupCronJobs;