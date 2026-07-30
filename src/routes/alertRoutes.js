const express = require("express");
const router = express.Router();

const alertController = require("../controllers/alertController");

router.post("/send", alertController.sendSOS);

module.exports = router;