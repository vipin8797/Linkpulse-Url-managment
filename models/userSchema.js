const mongoose = require("mongoose");


const passportLocalMongoose = require("passport-local-mongoose");

// const userSchema = new mongoose.Schema({
//     googleId: String,
//     name: { type: String, required: true }, // User full name
//     //email: { type: String,  unique: true }, // Unique email
//     sessionId: { type: String, default: null }, // 🔥 Guest user tracking ke liye
//     photo: String,
//     //createdAt: { type: Date, default: Date.now }, // Account creation date
//     // role: { type: String, enum: ["user", "admin"], default: "user" }, // 🔥 Future admin panel ke liye
// });



const userSchema = new mongoose.Schema({
    googleId: String,
    name: { type: String, required: true }, 
    email: { type: String }, // ✅ Unique but only for non-null values
    sessionId: { type: String, default: null, index: true }, // ✅ Indexed for faster lookups
    photo: String,
});


// ✅ Apply `passport-local-mongoose` for authentication
// userSchema.plugin(passportLocalMongoose, { usernameField: "email" });

// ✅ Create & Export User Model
const User = mongoose.model("User", userSchema);
module.exports = User;
