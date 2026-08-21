const express = require("express");

const router = express.Router();

const alertController = require("../controllers/alertController");

const { adminAuth } = require("../middleware/adminAuth");

const authCompany = require("../middleware/authCompany");

router.post(
    "/send",
    alertController.sendSOS
);

router.get(
    "/all",
    adminAuth,
    alertController.getAllAlerts
);

router.get(
    "/security-company",
    authCompany,
    alertController.getSecurityCompanyAlerts
);

// ==========================================
// UPDATE INCIDENT STATUS
// ==========================================

router.patch(
    "/:alertId/status",
    authCompany,
    alertController.updateIncidentStatus
);

module.exports = router;