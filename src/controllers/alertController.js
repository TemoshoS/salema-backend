const Contact = require("../models/Contact");
const User = require("../models/User");
const twilio = require("../utils/twilio");

exports.sendSOS = async (req, res) => {
    try {
        const { userId, latitude, longitude } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        const contacts = await Contact.find({ userId });

        if (!contacts.length) {
            return res.status(404).json({
                message: "No trusted contacts found",
            });
        }

        const location =
            latitude && longitude
                ? `https://maps.google.com/?q=${latitude},${longitude}`
                : "Location unavailable";

        const message =
            `🚨 EMERGENCY ALERT!\n\n` +
            `${user.fullName} has triggered an SOS alert and may be in danger.\n\n` +
            `Please contact them immediately.\n\n` +
            `📍 Live Location:\n${location}`;

        const results = [];

        for (const contact of contacts) {
            console.log("====================================");
            console.log(`📱 Sending SMS to ${contact.name}`);
            console.log(`📞 ${contact.phone}`);
            console.log("------------------------------------");
            console.log(message);
            console.log("====================================\n");

            // Uncomment when Twilio is active
            /*
            const sms = await twilio.messages.create({
                body: message,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: contact.phone,
            });

            results.push({
                phone: contact.phone,
                sid: sms.sid,
            });
            */

            results.push({
                phone: contact.phone,
                status: "Mock SMS sent",
            });
        }

        res.json({
            message: "SOS processed successfully",
            results,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: error.message,
        });
    }
};