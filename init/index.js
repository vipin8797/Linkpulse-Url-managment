// require("dotenv").config();
// const express = require("express");
// const mongoose = require("mongoose");

// const app = express();
// const port = process.env.PORT || 3000; // ✅ Default port agar env me na ho

// // ✅ Models Import
// const { ShortUrl, User, Summary, Analytics } = require("../models/index");

// // ✅ Function to Connect to Database
// async function connectDB() {
//     try {
//         await mongoose.connect("mongodb+srv://cy7795151:9ke9m1I6ysUgTGL7@cluster0.bme9i.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
//         console.log("🔥 Connected to MongoDB");
//     } catch (error) {
//         console.error("❌ DB Connection Failed:", error);
//         process.exit(1); // ✅ Fail hone par process exit kara do
//     }
// }












// // ✅ Start Server Only After DB is Connected
// connectDB().then(() => {
//     app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
// });
