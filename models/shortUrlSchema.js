const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// const shortUrlSchema = new mongoose.Schema({
//     originalUrl: { type: String, required: true },
//     shortUrl: { type: String, required: true, unique: true }, // 🔥 Full Shortened URL
//     qrCode: { type: String },
//     userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // 🔥 User ke liye
//     sessionId: { type: String, default: null }, // 🔥 Guest User ke liye
//     createdAt: { type: Date, default: Date.now },
//     expirationDate: { type: Date, default: null }, // 🔥 URL ka expiry time (null = No expiry)
//     isActive: { type: Boolean, default: true } // 🔥 Active/Inactive status
// });


const shortUrlSchema = new mongoose.Schema({
    originalUrl: { type: String, required: true },
    shortUrl: { type: String, required: true, unique: true }, 
    qrCode: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, 
    sessionId: { type: String, default: null, index: true }, // ✅ Indexed for faster lookups
    createdAt: { type: Date, default: Date.now },
    expirationDate: { type: Date, default: null }, 
    isActive: { type: Boolean, default: true } ,
    lastAccessedAt: { type: Date, default: Date.now, index: true }
});




// // Pre-find middleware to check expiration
// shortUrlSchema.pre('findOne', async function(next) {
//     const query = this.getQuery(); // Get the query (e.g., { shortUrl: 'abc123' })
//     const now = new Date();
  
//     // Find the document
//     const shortUrlDoc = await this.model.findOne(query);
  
//     if (shortUrlDoc && shortUrlDoc.expirationDate && shortUrlDoc.expirationDate < now && shortUrlDoc.isActive) {
//       // If expired and still active, deactivate it
//       shortUrlDoc.isActive = false;
//       await shortUrlDoc.save();
//     }
  
//     next();
//   });




 
// shortUrlSchema.post(["find", "findOne"], function (docs) {
//     if (!Array.isArray(docs)) docs = [docs]; // findOne ke liye array wrap
    
//     docs.forEach(async (doc) => {
//         if (doc.qrCode) {
//             const qrPath = path.join(__dirname, "..", "uploads", path.basename(doc.qrCode)); // ✅ Correct path

//             if (!fs.existsSync(qrPath)) {
//               //  console.log(`❌ File not found, setting QR code to empty: ${doc.qrCode}`);
//                 doc.qrCode = ""; // ✅ Empty string assign kar raha hai
//                 await doc.save(); // ✅ Document update ho jayega
//             }
//         }
//     });
// });

shortUrlSchema.index({ userId: 1 });
const ShortUrl = mongoose.model("ShortUrl", shortUrlSchema);
module.exports = ShortUrl;
