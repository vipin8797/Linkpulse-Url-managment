// const QRCodeStyling = require("qr-code-styling/lib/qr-code-styling.js");
// const { createCanvas } = require("canvas");
// const fs = require("fs");
// const path = require("path");

// // Upload directory
// const uploadDir = path.join(__dirname, "uploads");
// if (!fs.existsSync(uploadDir)) {
//     try {
//         fs.mkdirSync(uploadDir, { recursive: true });
//         console.log("Uploads directory created:", uploadDir);
//     } catch (error) {
//         console.error("Error creating uploads directory:", error);
//         throw error;
//     }
// }

// // Function to generate QR code and return file path
// async function generateAndGetQRCodePath(shortedUrl) {
//     try {
//         if (!shortedUrl) throw new Error("Shorted URL is required");

//         const uniqueId = shortedUrl.split('/').pop();
//         const qrFileName = `qr_${uniqueId}.png`;
//         const qrCodePath = path.join(uploadDir, qrFileName);

//         // Create a canvas instance for Node.js
//         const canvas = createCanvas(300, 300); // Match width and height

//         // Initialize QRCodeStyling with nodeCanvas
//         const qrCode = new QRCodeStyling({
//             width: 300,
//             height: 300,
//             data: shortedUrl,
//             dotsOptions: {
//                 color: "#000000",
//                 type: "square"
//             },
//             backgroundOptions: {
//                 color: "#ffffff"
//             },
//             cornersSquareOptions: {
//                 type: "square"
//             },
//             cornersDotOptions: {
//                 type: "square"
//             },
//             nodeCanvas: canvas // Explicitly pass the canvas object
//         });

//         // Generate and save QR code as PNG
//         await qrCode.getRawData("png").then((buffer) => {
//             fs.writeFileSync(qrCodePath, buffer);
//         });

//         console.log("QR Code generated:", qrCodePath);
//         return qrCodePath;
//     } catch (error) {
//         console.error("Error generating QR code:", error);
//         throw error;
//     }
// }

// // Example Usage
// (async () => {
//     try {
//         const qrPath = await generateAndGetQRCodePath("https://example.com/xyz");
//         console.log("Generated QR Path:", qrPath);
//     } catch (error) {
//         console.error("Failed to generate QR:", error);
//     }
// })();




// // testCanvas.js
// const { createCanvas } = require("canvas");

// try {
//     const canvas = createCanvas(200, 200);
//     console.log("Canvas created successfully:", canvas);
// } catch (error) {
//     console.error("Error creating canvas:", error);
// }



const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

async function generateAndGetQRCodePath(shortedUrl) {
  // Define the upload directory
  const uploadDir = path.join(__dirname, '..', 'uploads');
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
    throw new Error(`Failed to generate QR: ${error.message}`);
  }
}

module.exports = generateAndGetQRCodePath;