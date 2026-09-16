const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
        },

        // Links to the contact's Salema account
        // null if the contact has not registered yet
        contactUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        name: {
            type: String,
            required: true,
        },

        phone: {
            type: String,
            required: true,
        },

        relationship: {
            type: String,
            default: "friend",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Contact", contactSchema);