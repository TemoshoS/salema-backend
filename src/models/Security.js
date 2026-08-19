const mongoose = require("mongoose");

const securitySchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    phoneNumber: {
      type: String,
      required: true,
    },

    companyName: {
      type: String,
      required: true,
    },

    employeeNumber: {
      type: String,
      required: true,
      unique: true,
    },

    securityGrade: {
      type: String,
      enum: ["A", "B", "C", "D", "E"],
      required: true,
    },

    psiraNumber: {
      type: String,
      required: true,
      unique: true,
    },

    stationBranch: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      required: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      default: "security",
    },

    otp: String,
    otpExpires: Date,
    isVerified: {
      type: Boolean,
      default: false,
    },

    lastOtpVerifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Security", securitySchema);