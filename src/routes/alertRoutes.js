const express = require("express");

const router = express.Router();

const alertController = require("../controllers/alertController");

const { adminAuth } = require("../middleware/adminAuth");

const authCompany = require("../middleware/authCompany");

const authOfficer = require("../middleware/authOfficer");

// ==========================================
// SEND SOS
// ==========================================

router.post(
    "/send",
    alertController.sendSOS
);

// ==========================================
// GET ALL ALERTS - ADMIN
// ==========================================

router.get(
    "/all",
    adminAuth,
    alertController.getAllAlerts
);

// ==========================================
// GET COMPANY ALERTS
// ==========================================

router.get(
    "/security-company",
    authCompany,
    alertController.getSecurityCompanyAlerts
);

// ==========================================
// ASSIGN OFFICER
// ==========================================

router.patch(
    "/:alertId/assign-officer",
    authCompany,
    alertController.assignOfficer
);

// ==========================================
// UPDATE INCIDENT STATUS
// ==========================================

router.patch(
    "/:alertId/status",
    authOfficer,
    alertController.updateIncidentStatus
);

//get
router.get(
    "/officer/:officerId",
    alertController.getOfficerIncidents
);

router.get(
    "/officer",
    authOfficer,
    alertController.getOfficerAlerts
);
module.exports = router;