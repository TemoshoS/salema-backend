const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

exports.sendAlertSMS = async (req, res) => {
  try {
    const { contacts, message } = req.body;

    const results = [];

    for (const contact of contacts) {
      const sms = await client.messages.create({
        body: message || "🚨 Emergency Alert! Please check on me immediately.",
        from: process.env.TWILIO_PHONE_NUMBER,
        to: contact.phone, // must include country code e.g. +27...
      });

      results.push({
        phone: contact.phone,
        sid: sms.sid,
      });
    }

    res.json({
      message: "SMS sent successfully",
      results,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Failed to send SMS",
      error: error.message,
    });
  }
};