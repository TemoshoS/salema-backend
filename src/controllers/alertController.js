const Contact = require("../models/Contact");
const User = require("../models/User");
const SecurityCompany = require("../models/SecurityCompany");
const SecurityOfficer = require("../models/SecurityOfficer");
const Alert = require("../models/Alert");
const twilio = require("../utils/twilio");
const { sendPushNotification } = require("../utils/pushNotification");

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

        const contacts = await Contact.find({
            userId,
        }).populate(
            "contactUserId",
            "fullName email phoneNumber pushToken"
        );

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

            // ------------------------------------------
            // SMS
            // ------------------------------------------

            let smsStatus = "failed";
            let smsSid = null;
            let smsError = null;

            try {
                console.log(
                    `📱 Sending SOS SMS to ${contact.name} (${contact.phone})`
                );

                const sms = await twilio.messages.create({
                    body: message,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: contact.phone,
                });

                smsStatus = "sent";
                smsSid = sms.sid;

                console.log(
                    `✅ SOS SMS sent to ${contact.name}: ${sms.sid}`
                );

            } catch (error) {
                smsError = error.message;

                console.error(
                    `❌ Failed to send SMS to ${contact.phone}:`,
                    error.message
                );
            }

            // ------------------------------------------
            // PUSH NOTIFICATION
            // ------------------------------------------

            let pushStatus = "not_registered";

            if (contact.contactUserId) {

                if (contact.contactUserId.pushToken) {

                    const pushResult =
                        await sendPushNotification({
                            pushToken:
                                contact.contactUserId.pushToken,

                            title: "🚨 EMERGENCY SOS",

                            body:
                                `${user.fullName} has triggered an SOS alert. ` +
                                `Please check on them immediately.`,

                            data: {
                                type: "sos",

                                alertId:
                                    alert._id.toString(),

                                userId:
                                    user._id.toString(),

                                latitude,
                                longitude,

                                locationUrl: location,
                            },
                        });

                    pushStatus = pushResult.status;

                    console.log(
                        `📲 Push notification to ${contact.name}: ${pushStatus}`
                    );

                } else {
                    pushStatus = "no_push_token";

                    console.log(
                        `⚠️ ${contact.name} is registered on Salema but has no push token`
                    );
                }

            } else {

                console.log(
                    `ℹ️ ${contact.name} is not registered on Salema. SMS only.`
                );
            }

            // ------------------------------------------
            // RESPONSE RESULT
            // ------------------------------------------

            results.push({
                type: "trusted_contact",

                name: contact.name,

                phone: contact.phone,

                status: smsStatus,

                sid: smsSid,

                smsStatus,

                pushStatus,

                ...(smsError && {
                    error: smsError,
                }),
            });

            // ------------------------------------------
            // SAVE SMS RESULT TO DATABASE
            // ------------------------------------------

            alert.recipients.push({
                type: "trusted_contact",

                name: contact.name,

                phone: contact.phone,

                // SMS status
                status: smsStatus,

                // Push notification status
                pushStatus,

                twilioSid: smsSid,

                ...(smsError && {
                    error: smsError,
                }),
            });
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

                results.push({
                    type: "security_company",
                    companyName:
                        securityCompany.companyName,
                    phone:
                        securityCompany.phoneNumber,
                    sid: sms.sid,
                    status: "sent",
                });

                alert.recipients.push({
                    type: "security_company",
                    name:
                        securityCompany.companyName,
                    phone:
                        securityCompany.phoneNumber,
                    status: "sent",
                    twilioSid: sms.sid,
                });

            } catch (error) {

                console.error(
                    `Failed to send SMS to ${securityCompany.phoneNumber}:`,
                    error.message
                );

                results.push({
                    type: "security_company",
                    companyName:
                        securityCompany.companyName,
                    phone:
                        securityCompany.phoneNumber,
                    status: "failed",
                    error: error.message,
                });

                alert.recipients.push({
                    type: "security_company",
                    name:
                        securityCompany.companyName,
                    phone:
                        securityCompany.phoneNumber,
                    status: "failed",
                    error: error.message,
                });
            }
        }

        // ==========================================
        // 10. CALCULATE DELIVERY STATUS
        // ==========================================

        // A trusted contact is considered successfully
        // reached if either SMS OR push notification succeeds.
        //
        // Security company is SMS only.

        const deliveredResults = results.filter((result) => {
            // Trusted contact
            if (result.type === "trusted_contact") {
                return (
                    result.smsStatus === "sent" ||
                    result.pushStatus === "sent"
                );
            }

            // Security company
            return result.status === "sent";
        });

        const failedResults = results.filter((result) => {
            // Trusted contact
            if (result.type === "trusted_contact") {
                return (
                    result.smsStatus !== "sent" &&
                    result.pushStatus !== "sent"
                );
            }

            // Security company
            return result.status === "failed";
        });

        const sentCount = deliveredResults.length;

        const failedCount = failedResults.length;

        // ==========================================
        // 11. UPDATE ALERT STATUS
        // ==========================================

        if (sentCount > 0 && failedCount === 0) {

            alert.status = "sent";

        } else if (
            sentCount > 0 &&
            failedCount > 0
        ) {

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
                    name:
                        securityCompany.companyName,
                    phone:
                        securityCompany.phoneNumber,
                }
                : null,

            sentCount,

            failedCount,

            results,
        });

    } catch (error) {

        console.error(
            "SOS ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to process SOS alert",
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
            "new",
            "acknowledged",
            "responding",
            "resolved",
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid incident status",
            });
        }

        // ==========================================
        // FIND INCIDENT
        // ==========================================

        const alert = await Alert.findById(alertId);

        if (!alert) {
            return res.status(404).json({
                message: "Incident not found",
            });
        }

        // ==========================================
        // GET LOGGED-IN OFFICER
        // ==========================================

        const officer = await SecurityOfficer.findById(
            req.officer._id
        );

        if (!officer) {
            return res.status(404).json({
                message: "Officer not found",
            });
        }

        // ==========================================
        // CHECK INCIDENT IS ASSIGNED TO THIS OFFICER
        // ==========================================

        if (
            !alert.assignedOfficer ||
            alert.assignedOfficer.toString() !==
            officer._id.toString()
        ) {
            return res.status(403).json({
                message:
                    "You are not allowed to update this incident",
            });
        }

        // ==========================================
        // CHECK OFFICER BELONGS TO COMPANY
        // ==========================================

        if (!officer.companyId) {
            return res.status(403).json({
                message:
                    "Officer is not associated with a security company",
            });
        }

        // ==========================================
        // UPDATE STATUS
        // ==========================================

        alert.incidentStatus = status;

        await alert.save();

        // ==========================================
        // RETURN UPDATED INCIDENT
        // ==========================================

        const updatedAlert = await Alert.findById(alert._id)
            .populate(
                "userId",
                "fullName email phoneNumber"
            )
            .populate(
                "assignedOfficer",
                "firstName lastName email phoneNumber rank status"
            );

        return res.status(200).json({
            message:
                "Incident status updated successfully",
            alert: updatedAlert,
        });

    } catch (error) {
        console.error(
            "UPDATE INCIDENT STATUS ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to update incident status",
            error: error.message,
        });
    }
};

exports.assignOfficer = async (req, res) => {
    try {
        const { alertId } = req.params;
        const { officerId } = req.body;

        // ==========================================
        // VALIDATE OFFICER ID
        // ==========================================

        if (!officerId) {
            return res.status(400).json({
                message: "Officer ID is required",
            });
        }

        // ==========================================
        // FIND ALERT
        // ==========================================

        const alert = await Alert.findById(alertId);

        if (!alert) {
            return res.status(404).json({
                message: "Incident not found",
            });
        }

        // ==========================================
        // CHECK INCIDENT BELONGS TO LOGGED-IN COMPANY
        // ==========================================

        if (
            !alert.securityCompany?.id ||
            alert.securityCompany.id.toString() !==
            req.company._id.toString()
        ) {
            return res.status(403).json({
                message:
                    "You are not allowed to manage this incident",
            });
        }

        // ==========================================
        // FIND OFFICER
        // ==========================================

        const officer = await SecurityOfficer.findById(
            officerId
        );

        if (!officer) {
            return res.status(404).json({
                message: "Officer not found",
            });
        }

        // ==========================================
        // CHECK OFFICER BELONGS TO LOGGED-IN COMPANY
        // ==========================================

        if (
            officer.companyId.toString() !==
            req.company._id.toString()
        ) {
            return res.status(403).json({
                message:
                    "This officer does not belong to your company",
            });
        }

        // ==========================================
        // ONLY ACTIVE OFFICERS CAN BE ASSIGNED
        // ==========================================

        if (officer.status !== "active") {
            return res.status(400).json({
                message:
                    "Only active officers can be assigned to an incident",
            });
        }

        // ==========================================
        // ASSIGN OFFICER TO INCIDENT
        // ==========================================

        alert.assignedOfficer = officer._id;

        // Company has acknowledged the incident
        alert.incidentStatus = "acknowledged";

        await alert.save();

        // ==========================================
        // FIND THE SOS USER
        // ==========================================

        const user = await User.findById(alert.userId);

        // ==========================================
        // GET INCIDENT LOCATION
        // ==========================================

        const location =
            alert.locationUrl ||
            (alert.latitude != null &&
                alert.longitude != null
                ? `https://maps.google.com/?q=${alert.latitude},${alert.longitude}`
                : "Location unavailable");

        // ==========================================
        // CREATE OFFICER SMS MESSAGE
        // ==========================================

        const officerMessage =
            `🚨 NEW EMERGENCY INCIDENT\n\n` +
            `You have been assigned to an SOS incident.\n\n` +
            `👤 User: ${user?.fullName || "Unknown User"}\n` +
            `📞 Phone: ${user?.phoneNumber || "Not available"}\n\n` +
            `📍 Location:\n${location}\n\n` +
            `⚠️ Please respond immediately.`;

        // ==========================================
        // SEND SMS TO ASSIGNED OFFICER
        // ==========================================

        let notificationStatus = "not_sent";

        try {
            if (officer.phoneNumber) {
                const sms = await twilio.messages.create({
                    body: officerMessage,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: officer.phoneNumber,
                });

                notificationStatus = "sent";

                console.log(
                    `🚨 Incident notification sent to officer ${officer.firstName} ${officer.lastName}: ${sms.sid}`
                );
            } else {
                notificationStatus = "no_phone_number";

                console.log(
                    `Officer ${officer.firstName} ${officer.lastName} has no phone number`
                );
            }
        } catch (smsError) {
            notificationStatus = "failed";

            console.error(
                "FAILED TO NOTIFY ASSIGNED OFFICER:",
                smsError.message
            );
        }

        // ==========================================
        // GET UPDATED ALERT WITH DETAILS
        // ==========================================

        const updatedAlert = await Alert.findById(
            alert._id
        )
            .populate(
                "userId",
                "fullName email phoneNumber"
            )
            .populate(
                "assignedOfficer",
                "firstName lastName email phoneNumber rank status"
            );

        // ==========================================
        // SUCCESS RESPONSE
        // ==========================================

        return res.status(200).json({
            message: "Officer assigned successfully",
            notificationStatus,
            alert: updatedAlert,
        });
    } catch (error) {
        console.error(
            "ASSIGN OFFICER ERROR:",
            error
        );

        return res.status(500).json({
            message: "Failed to assign officer",
            error: error.message,
        });
    }
};

exports.getOfficerIncidents = async (req, res) => {
    try {
        const { officerId } = req.params;

        const alerts = await Alert.find({
            assignedOfficer: officerId,
            incidentStatus: {
                $in: [
                    "acknowledged",
                    "responding",
                ],
            },
        })
            .populate(
                "userId",
                "fullName email phoneNumber"
            )
            .populate(
                "assignedOfficer",
                "firstName lastName email phoneNumber rank status"
            )
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Officer incidents retrieved successfully",
            count: alerts.length,
            alerts,
        });

    } catch (error) {
        console.error(
            "GET OFFICER INCIDENTS ERROR:",
            error
        );

        return res.status(500).json({
            message: "Failed to retrieve officer incidents",
            error: error.message,
        });
    }
};

exports.getOfficerAlerts = async (req, res) => {
    try {
        const officerId = req.officer._id;

        const alerts = await Alert.find({
            assignedOfficer: officerId,
        })
            .populate(
                "userId",
                "fullName email phoneNumber"
            )
            .populate(
                "assignedOfficer",
                "firstName lastName email phoneNumber rank status"
            )
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Officer incidents retrieved successfully",
            count: alerts.length,
            alerts,
        });
    } catch (error) {
        console.error(
            "GET OFFICER ALERTS ERROR:",
            error
        );

        return res.status(500).json({
            message: "Failed to retrieve officer incidents",
            error: error.message,
        });
    }
};