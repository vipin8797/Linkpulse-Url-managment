const multer = require("multer");
const path = require("path");
const fs = require("fs");

// const uploadDir = path.join(__dirname, "utils", "uploads"); // update this path for futer change// qr storing path
const uploadDir = "uploads" // update this path for futer change// qr storing path

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueId = req.params.id; // Use link ID for uniqueness
        cb(null, `qr_${uniqueId}.png`); // Overwrite existing QR code
    }
});
const upload = multer({ storage });


module.exports = upload;
