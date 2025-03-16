const mongoose = require("mongoose");


const analyticsSchema = new mongoose.Schema({
    shortUrlId: { type: mongoose.Schema.Types.ObjectId, ref: "ShortUrl", required: true }, 
    // userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    date: { type: Date, default: Date.now },

    totalClicks: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    avgTimeOnPage: { type: Number, default: 0 },
    bounceRate: { type: Number, default: 0 },

    userAgents: [{ 
        browser: String, 
        device: String, 
        os: String 
    }], // 🔥 FIXED: Now stores object instead of string

    ipAddresses: [{ type: String }],
    
    locationData: [{ 
        country: String, 
        city: String, 
        region: String, 
        lat: Number, 
        lon: Number 
    }], // 🔥 FIXED: Now properly stores location details
    
    referrers: [{ type: String }] 
});
const Analytics = mongoose.model("Analytics", analyticsSchema);
module.exports = Analytics;
