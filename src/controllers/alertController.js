const Contact = require("../models/Contact");
const User = require("../models/User");
const SecurityCompany = require("../models/SecurityCompany");
const twilio = require("../utils/twilio");

exports.sendSOS = async (req, res) => {
    try {
        const {
            userId,
            latitude,
            longitude,
            securityCompanyId,
        } = req.body;

        // ==========================================
        // 1. FIND USER
        // ==========================================

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        // ==========================================
        // 2. FIND TRUSTED CONTACTS
        // ==========================================

        const contacts = await Contact.find({ userId });

        // ==========================================
        // 3. FIND SELECTED SECURITY COMPANY
        // ==========================================

        let securityCompany = null;

        if (securityCompanyId) {
            securityCompany = await SecurityCompany.findById(
                securityCompanyId
            );

            if (!securityCompany) {
                return res.status(404).json({
                    message: "Selected security company not found",
                });
            }
        }

        // ==========================================
        // 4. CHECK THAT THERE IS SOMEONE TO ALERT
        // ==========================================

        if (!contacts.length && !securityCompany) {
            return res.status(404).json({
                message:
                    "No trusted contacts or security company selected",
            });
        }

        // ==========================================
        // 5. LOCATION
        // ==========================================

        const location =
            latitude && longitude
                ? `https://maps.google.com/?q=${latitude},${longitude}`
                : "Location unavailable";

        // ==========================================
        // 6. SMS MESSAGE
        // ==========================================

        const message =
            `🚨 EMERGENCY ALERT!\n\n` +
            `${user.fullName} has triggered an SOS alert and may be in danger.\n\n` +
            `Please contact them immediately.\n\n` +
            `📍 Live Location:\n${location}`;

        const results = [];

        // ==========================================
        // 7. SEND TO TRUSTED CONTACTS
        // ==========================================

        for (const contact of contacts) {
            console.log("====================================");
            console.log(`📱 Sending SMS to ${contact.name}`);
            console.log(`📞 ${contact.phone}`);
            console.log("------------------------------------");
            console.log(message);
            console.log("====================================\n");

            try {
                const sms = await twilio.messages.create({
                    body: message,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: contact.phone,
                });

                results.push({
                    type: "trusted_contact",
                    name: contact.name,
                    phone: contact.phone,
                    sid: sms.sid,
                    status: "sent",
                });
            } catch (error) {
                console.error(
                    `Failed to send SMS to ${contact.phone}:`,
                    error.message
                );

                results.push({
                    type: "trusted_contact",
                    name: contact.name,
                    phone: contact.phone,
                    status: "failed",
                    error: error.message,
                });
            }
        }

        // ==========================================
        // 8. SEND TO SELECTED SECURITY COMPANY
        // ==========================================

        if (securityCompany) {
            console.log("====================================");
            console.log(
                `🏢 Sending SMS to ${securityCompany.companyName}`
            );
            console.log(
                `📞 ${securityCompany.phoneNumber}`
            );
            console.log("------------------------------------");
            console.log(message);
            console.log("====================================\n");

            try {
                const sms = await twilio.messages.create({
                    body: message,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: securityCompany.phoneNumber,
                });

                results.push({
                    type: "security_company",
                    companyName: securityCompany.companyName,
                    phone: securityCompany.phoneNumber,
                    sid: sms.sid,
                    status: "sent",
                });
            } catch (error) {
                console.error(
                    `Failed to send SMS to ${securityCompany.phoneNumber}:`,
                    error.message
                );

                results.push({
                    type: "security_company",
                    companyName: securityCompany.companyName,
                    phone: securityCompany.phoneNumber,
                    status: "failed",
                    error: error.message,
                });
            }
        }

        // ==========================================
        // 9. RESPONSE
        // ==========================================

        res.json({
            message: "SOS alert processed successfully",
            user: user.fullName,
            securityCompany: securityCompany
                ? {
                      id: securityCompany._id,
                      name: securityCompany.companyName,
                      phone: securityCompany.phoneNumber,
                  }
                : null,
            results,
        });
    } catch (error) {
        console.error("SOS ERROR:", error);

        res.status(500).json({
            message: "Failed to process SOS alert",
            error: error.message,
        });
    }
};