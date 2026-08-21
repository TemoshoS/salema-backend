const Contact = require("../models/Contact");
const User = require("../models/User");
const SecurityCompany = require("../models/SecurityCompany");
const Alert = require("../models/Alert");
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
        // 3. FIND SECURITY COMPANY IF SELECTED
        // ==========================================

        let securityCompany = null;

        if (securityCompanyId) {
            securityCompany = await SecurityCompany.findById(
                securityCompanyId
            );

            // Old/deleted company ID in AsyncStorage
            if (!securityCompany) {
                console.log(
                    "Selected security company no longer exists. Continuing with trusted contacts."
                );

                securityCompany = null;
            }
        }

        // ==========================================
        // 4. CHECK THAT THERE IS SOMEONE TO ALERT
        // ==========================================

        if (!contacts.length && !securityCompany) {
            return res.status(400).json({
                message:
                    "Please add at least one trusted contact or select a security company.",
            });
        }

        // ==========================================
        // 5. LOCATION
        // ==========================================

        const location =
            latitude !== undefined &&
                longitude !== undefined
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
        // 7. CREATE ALERT HISTORY
        // ==========================================

        const alert = await Alert.create({
            userId: user._id,

            latitude,
            longitude,

            locationUrl: location,

            message,

            triggerType: "button",

            securityCompany: securityCompany
                ? {
                    id: securityCompany._id,
                    name: securityCompany.companyName,
                    phone: securityCompany.phoneNumber,
                }
                : undefined,

            recipients: [],
        });

        // ==========================================
        // 8. SEND TO TRUSTED CONTACTS
        // ==========================================

        for (const contact of contacts) {
            try {
                console.log(
                    `📱 Sending SOS SMS to ${contact.name} (${contact.phone})`
                );

                const sms = await twilio.messages.create({
                    body: message,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: contact.phone,
                });

                // Response result
                results.push({
                    type: "trusted_contact",
                    name: contact.name,
                    phone: contact.phone,
                    sid: sms.sid,
                    status: "sent",
                });

                // Save to database
                alert.recipients.push({
                    type: "trusted_contact",
                    name: contact.name,
                    phone: contact.phone,
                    status: "sent",
                    twilioSid: sms.sid,
                });

            } catch (error) {
                console.error(
                    `Failed to send SMS to ${contact.phone}:`,
                    error.message
                );

                // Response result
                results.push({
                    type: "trusted_contact",
                    name: contact.name,
                    phone: contact.phone,
                    status: "failed",
                    error: error.message,
                });

                // Save failed SMS to database
                alert.recipients.push({
                    type: "trusted_contact",
                    name: contact.name,
                    phone: contact.phone,
                    status: "failed",
                    error: error.message,
                });
            }
        }

        // ==========================================
        // 9. SEND TO SECURITY COMPANY IF SELECTED
        // ==========================================

        if (securityCompany) {
            try {
                console.log(
                    `🏢 Sending SOS SMS to ${securityCompany.companyName} (${securityCompany.phoneNumber})`
                );

                const sms = await twilio.messages.create({
                    body: message,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: securityCompany.phoneNumber,
                });

                // Response result
                results.push({
                    type: "security_company",
                    companyName: securityCompany.companyName,
                    phone: securityCompany.phoneNumber,
                    sid: sms.sid,
                    status: "sent",
                });

                // Save to database
                alert.recipients.push({
                    type: "security_company",
                    name: securityCompany.companyName,
                    phone: securityCompany.phoneNumber,
                    status: "sent",
                    twilioSid: sms.sid,
                });

            } catch (error) {
                console.error(
                    `Failed to send SMS to ${securityCompany.phoneNumber}:`,
                    error.message
                );

                // Response result
                results.push({
                    type: "security_company",
                    companyName: securityCompany.companyName,
                    phone: securityCompany.phoneNumber,
                    status: "failed",
                    error: error.message,
                });

                // Save failed SMS to database
                alert.recipients.push({
                    type: "security_company",
                    name: securityCompany.companyName,
                    phone: securityCompany.phoneNumber,
                    status: "failed",
                    error: error.message,
                });
            }
        }

        // ==========================================
        // 10. CALCULATE STATUS
        // ==========================================

        const sentCount = results.filter(
            (result) => result.status === "sent"
        ).length;

        const failedCount = results.filter(
            (result) => result.status === "failed"
        ).length;

        // ==========================================
        // 11. UPDATE ALERT STATUS
        // ==========================================

        if (sentCount > 0 && failedCount === 0) {
            alert.status = "sent";
        } else if (sentCount > 0 && failedCount > 0) {
            alert.status = "partial";
        } else {
            alert.status = "failed";
        }

        // ==========================================
        // 12. SAVE ALERT HISTORY
        // ==========================================

        await alert.save();

        // ==========================================
        // 13. RESPONSE
        // ==========================================

        return res.json({
            message:
                sentCount > 0
                    ? "SOS alert sent successfully"
                    : "SOS alert could not be delivered",

            alertId: alert._id,

            user: user.fullName,

            securityCompany: securityCompany
                ? {
                    id: securityCompany._id,
                    name: securityCompany.companyName,
                    phone: securityCompany.phoneNumber,
                }
                : null,

            sentCount,
            failedCount,

            results,
        });

    } catch (error) {
        console.error("SOS ERROR:", error);

        return res.status(500).json({
            message: "Failed to process SOS alert",
            error: error.message,
        });
    }


};

exports.getAllAlerts = async (req, res) => {
    try {
        const alerts = await Alert.find()
            .populate("userId", "fullName email phoneNumber")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Alerts retrieved successfully",
            count: alerts.length,
            alerts,
        });
    } catch (error) {
        console.error("GET ALL ALERTS ERROR:", error);

        return res.status(500).json({
            message: "Failed to retrieve alerts",
            error: error.message,
        });
    }
};
exports.getSecurityCompanyAlerts = async (req, res) => {
    try {
        // Logged-in security company
        const companyId = req.company._id;

        const alerts = await Alert.find({
            "securityCompany.id": companyId,
        })
            .populate(
                "userId",
                "fullName email phoneNumber"
            )
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message:
                "Security company alerts retrieved successfully",
            count: alerts.length,
            alerts,
        });

    } catch (error) {
        console.error(
            "GET SECURITY COMPANY ALERTS ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to retrieve security company alerts",
            error: error.message,
        });
    }
};
exports.updateIncidentStatus = async (req, res) => {
    try {
        const { alertId } = req.params;
        const { status } = req.body;

        const allowedStatuses = [
            "pending",
            "acknowledged",
            "responding",
            "resolved",
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid incident status",
            });
        }

        const alert = await Alert.findById(alertId);

        if (!alert) {
            return res.status(404).json({
                message: "Incident not found",
            });
        }

        alert.incidentStatus = status;

        await alert.save();

        return res.status(200).json({
            message: "Incident status updated successfully",
            alert,
        });

    } catch (error) {
        console.error(
            "UPDATE INCIDENT STATUS ERROR:",
            error
        );

        return res.status(500).json({
            message: "Failed to update incident status",
            error: error.message,
        });
    }
};