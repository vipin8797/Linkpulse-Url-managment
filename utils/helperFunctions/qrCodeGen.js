


const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

async function generateAndGetQRCodePath(shortedUrl) {
  // Define the upload directory
  //const uploadDir = path.join(__dirname, '..', 'uploads');
  const uploadDir = "uploads" // update this path for futer change// qr storing path

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Generate a unique filename based on the shortened URL
  const uniqueId = shortedUrl.split('/').pop();
  const qrFileName = `qr_${uniqueId}.png`;
  const qrCodePath = path.join(uploadDir, qrFileName);

  // Generate the QR code and save it to a file
  try {
    await QRCode.toFile(qrCodePath, shortedUrl, {
      width: 300,
      color: {
        dark: '#000000',  // Dark modules
        light: '#ffffff'  // Light background
      }
    });
    return qrCodePath;
  } catch (error) {
     next(new ExpressError(`Failed to generate QR: ${error.message}`));
  }
}

module.exports = generateAndGetQRCodePath;