const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const chatbot = async (req, res) => {
  try {
    const { message } = req.body;

    const response = await client.responses.create({
      model: "gpt-5",
      input: [
        {
          role: "system",
          content: `
You are Salema AI.

Salema is a safety application focused on Gender-Based Violence prevention.

Your responsibilities:

- Help users understand GBV.
- Explain how to use the Salema app.
- Encourage users to contact emergency services if in immediate danger.
- Be supportive and calm.
- Never provide medical or legal advice as fact.
- Never encourage violence.
- Keep answers under 150 words unless asked for more.
`
        },
        {
          role: "user",
          content: message
        }
      ]
    });

    res.json({
      success: true,
      reply: response.output_text
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Chatbot unavailable"
    });
  }
};

module.exports = { chatbot };