const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

const sendPushNotification = async ({
    pushToken,
    title,
    body,
    data = {},
}) => {
    // No push token means the contact
    // cannot receive a push notification.
    if (!pushToken) {
        return {
            status: "no_token",
        };
    }

    try {
        const message = {
            to: pushToken,
            sound: "default",
            title,
            body,
            data,
        };

        const response = await fetch(
            EXPO_PUSH_URL,
            {
                method: "POST",

                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },

                body: JSON.stringify(message),
            }
        );

        const result = await response.json();

        console.log(
            "📤 PUSH RESULT:",
            JSON.stringify(result)
        );

        if (result?.data?.status === "ok") {
            return {
                status: "sent",
                result,
            };
        }

        return {
            status: "failed",
            result,
        };

    } catch (error) {
        console.error(
            "❌ PUSH NOTIFICATION ERROR:",
            error.message
        );

        return {
            status: "failed",
            error: error.message,
        };
    }
};

module.exports = {
    sendPushNotification,
};