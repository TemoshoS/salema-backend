const express = require("express");
const router = express.Router();

const { chatbot } = require("../controllers/chatController");

router.post("/", chatbot);

module.exports = router;