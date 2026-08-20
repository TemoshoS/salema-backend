const express = require("express");
const router = express.Router();

const alertController = require("../controllers/alertController");
const { adminAuth } = require("../middleware/adminAuth");

router.post("/send", alertController.sendSOS);
router.get(
    "/all",
    adminAuth,
    alertController.getAllAlerts
  );

module.exports = router;