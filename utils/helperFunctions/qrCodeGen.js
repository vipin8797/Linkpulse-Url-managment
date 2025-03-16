const QRCode = require('qrcode');

async function generateQRCode(url) {
    try {
        const qrCodeBase64 = await QRCode.toDataURL(url);
        return qrCodeBase64;
    } catch (error) {
        console.error("QR Code Generation Error:", error);
        throw error;
    }
}

module.exports = generateQRCode;
