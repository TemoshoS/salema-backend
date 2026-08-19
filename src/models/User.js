const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        fullName: { type: String, required: true },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        phoneNumber: { type: String, required: true },
        address: { type: String, required: true },

        password: { type: String, required: true },

        role: {
            type: String,
            enum: ["client", "security"],
            default: "client",
        },
        otp: { type: String },
        otpExpires: { type: Date },
        isVerified: { type: Boolean, default: false },
        lastOtpVerifiedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);