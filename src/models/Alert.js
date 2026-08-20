const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        latitude: Number,
        longitude: Number,

        locationUrl: String,

        message: {
            type: String,
            required: true,
        },

        triggerType: {
            type: String,
            enum: ["button", "shake", "voice"],
            default: "button",
        },

        securityCompany: {
            id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "SecurityCompany",
            },
            name: String,
            phone: String,
        },

        recipients: [
            {
                type: {
                    type: String,
                    enum: [
                        "trusted_contact",
                        "security_company",
                    ],
                },

                name: String,
                phone: String,

                status: {
                    type: String,
                    enum: ["pending", "sent", "failed"],
                    default: "pending",
                },

                twilioSid: String,
                error: String,
            },
        ],

        status: {
            type: String,
            enum: ["pending", "sent", "partial", "failed"],
            default: "pending",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Alert", alertSchema);