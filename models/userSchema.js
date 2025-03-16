const mongoose = require("mongoose");


const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true }, // User full name
    email: { type: String, required: true, unique: true }, // Unique email
    sessionId: { type: String, default: null }, // 🔥 Guest user tracking ke liye
    role: { type: String, enum: ["user", "admin"], default: "user" }, // 🔥 Future admin panel ke liye
    createdAt: { type: Date, default: Date.now } // Account creation date
});

// ✅ Apply `passport-local-mongoose` for authentication
userSchema.plugin(passportLocalMongoose, { usernameField: "email" });

// ✅ Create & Export User Model
const User = mongoose.model("User", userSchema);
module.exports = User;
