const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    email: String,
    secret: String   // 🔥 for QR authenticator
});

module.exports = mongoose.model("User", userSchema);