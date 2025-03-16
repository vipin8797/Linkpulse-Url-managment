const mongoose = require("mongoose");


const summarySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // 🔥 User-wise summary
    totalClicks: { type: Number, default: 0 },
    totalUniqueVisitors: { type: Number, default: 0 },
    avgConversionRate: { type: Number, default: 0 },
    avgTimeOnPage: { type: Number, default: 0 },
    avgBounceRate: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now } // 🔥 Last time summary update hua
});

const Summary = mongoose.model("Summary", summarySchema);
module.exports = Summary;
