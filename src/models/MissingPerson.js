const mongoose = require("mongoose");

const missingPersonSchema = new mongoose.Schema(
  {
    // User who reported the missing person
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Basic Details
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    age: {
      type: Number,
      required: true,
      min: 0,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },


    description: {
      type: String,
      required: true,
      trim: true,
    },

    // Last Seen
    lastSeenLocation: {
      type: String,
      required: true,
      trim: true,
    },

    lastSeenDate: {
      type: Date,
      required: true,
    },

    // GPS Coordinates (optional)
    latitude: {
      type: Number,
      default: null,
    },

    longitude: {
      type: Number,
      default: null,
    },

    // Photo URL
    photo: {
      type: String,
      default: "",
    },

    // Contact Details
    contactName: {
      type: String,
      required: true,
    },

    contactNumber: {
      type: String,
      required: true,
    },

    // Investigation Status
    status: {
      type: String,
      enum: ["Missing", "Found"],
      default: "Missing",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "MissingPerson",
  missingPersonSchema
);