require("dotenv").config();

const twilio = require("twilio");

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

async function testTwilio() {
    try {
        const account = await client.api
            .accounts(process.env.TWILIO_ACCOUNT_SID)
            .fetch();

        console.log("====================================");
        console.log("✅ TWILIO AUTHENTICATION SUCCESS");
        console.log("Account SID:", account.sid);
        console.log("Account Status:", account.status);
        console.log("====================================");
    } catch (error) {
        console.log("====================================");
        console.log("❌ TWILIO AUTHENTICATION FAILED");
        console.log("Code:", error.code);
        console.log("Status:", error.status);
        console.log("Message:", error.message);
        console.log("====================================");
    }
}

testTwilio();