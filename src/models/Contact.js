const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true },

        name: { type: String, required: true },
        phone: { type: String, required: true },
        relationship: { type: String, default: "friend" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Contact", contactSchema);