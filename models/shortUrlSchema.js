const mongoose = require("mongoose");

const shortUrlSchema = new mongoose.Schema({
    originalUrl: { type: String, required: true },
    shortUrl: { type: String, required: true, unique: true }, // 🔥 Full Shortened URL
    qrCode: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // 🔥 User ke liye
    sessionId: { type: String, default: null }, // 🔥 Guest User ke liye
    createdAt: { type: Date, default: Date.now },
    expirationDate: { type: Date, default: null }, // 🔥 URL ka expiry time (null = No expiry)
    isActive: { type: Boolean, default: true } // 🔥 Active/Inactive status
});


// 🔥 Middleware to delete analytics data when a Short URL is deleted
shortUrlSchema.post("findOneAndDelete", async function (doc) {
    if (doc) {
        await Analytics.deleteMany({ shortUrlId: doc._id });
        // console.log(`Analytics data for ShortUrl ID ${doc._id} deleted.`);
    }
});

// // ✅ Expired URLs ko automatically inactive karne ke liye middleware
// shortUrlSchema.pre("save", function (next) {
//     if (this.expirationDate && this.expirationDate < new Date()) {
//         this.isActive = false; // 🔥 Agar expiry date cross ho gayi toh URL inactive ho jayega
//     }
//     next();
// });

const ShortUrl = mongoose.model("ShortUrl", shortUrlSchema);
module.exports = ShortUrl;
