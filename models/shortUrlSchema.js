const mongoose = require("mongoose");

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
    isActive: { type: Boolean, default: true } 
});




// Pre-find middleware to check expiration
shortUrlSchema.pre('findOne', async function(next) {
    const query = this.getQuery(); // Get the query (e.g., { shortUrl: 'abc123' })
    const now = new Date();
  
    // Find the document
    const shortUrlDoc = await this.model.findOne(query);
  
    if (shortUrlDoc && shortUrlDoc.expirationDate && shortUrlDoc.expirationDate < now && shortUrlDoc.isActive) {
      // If expired and still active, deactivate it
      shortUrlDoc.isActive = false;
      await shortUrlDoc.save();
    }
  
    next();
  });

const ShortUrl = mongoose.model("ShortUrl", shortUrlSchema);
module.exports = ShortUrl;
