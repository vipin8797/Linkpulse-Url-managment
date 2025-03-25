// const mongoose = require("mongoose");


// const summarySchema = new mongoose.Schema({
//     userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // 🔥 User-wise summary
//     totalClicks: { type: Number, default: 0 },
//     totalUniqueVisitors: { type: Number, default: 0 },
//     avgConversionRate: { type: Number, default: 0 },
//     avgTimeOnPage: { type: Number, default: 0 },
//     avgBounceRate: { type: Number, default: 0 },
//     lastUpdated: { type: Date, default: Date.now } // 🔥 Last time summary update hua
// });

// const Summary = mongoose.model("Summary", summarySchema);
// module.exports = Summary;





const mongoose = require('mongoose');

const summarySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  totalClicks: { type: Number, default: 0 },
  totalUniqueVisitors: { type: Number, default: 0 },
  avgConversionRate: { type: Number, default: 0 },
  avgTimeOnPage: { type: Number, default: 0 },
  avgBounceRate: { type: Number, default: 0 },
  totalShortUrls: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
  userAgentsSummary: {
    browsers: [{ name: String, count: { type: Number, default: 0 } }],
    devices: [{ name: String, count: { type: Number, default: 0 } }],
    os: [{ name: String, count: { type: Number, default: 0 } }]
  },
  locationSummary: {
    countries: [{ name: String, count: { type: Number, default: 0 } }],
    cities: [{ name: String, count: { type: Number, default: 0 } }],
    coordinates: [{ lat: Number, lon: Number, count: { type: Number, default: 0 } }]
  },
  referrersSummary: [{ name: String, count: { type: Number, default: 0 } }],
  ipSummary: [{ ip: String, count: { type: Number, default: 0 } }]
});

const Summary = mongoose.model('Summary', summarySchema);
module.exports = Summary;


