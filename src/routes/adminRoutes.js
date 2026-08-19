const express = require("express");

const router = express.Router();

const adminController = require("../controllers/adminController");

const {
  adminAuth,
} = require("../middleware/adminAuth");


// =====================================================
// Authentication
// =====================================================

router.post(
  "/login",
  adminController.loginAdmin
);

router.post(
  "/create",
  adminController.createAdmin
);


// =====================================================
// Admin Profile
// =====================================================

router.get(
  "/profile",
  adminAuth,
  adminController.getAdminProfile
);


// =====================================================
// Security Companies
// =====================================================

router.get(
  "/security-companies",
  adminAuth,
  adminController.getAllSecurityCompanies
);

router.get(
  "/security-companies/pending",
  adminAuth,
  adminController.getPendingSecurityCompanies
);

router.get(
  "/security-companies/:id",
  adminAuth,
  adminController.getSecurityCompany
);


// =====================================================
// Approve / Reject
// =====================================================

router.put(
  "/security-companies/:id/approve",
  adminAuth,
  adminController.approveSecurityCompany
);

router.put(
  "/security-companies/:id/reject",
  adminAuth,
  adminController.rejectSecurityCompany
);


// =====================================================
// Logout
// =====================================================

router.post(
  "/logout",
  adminAuth,
  adminController.logoutAdmin
);


module.exports = router;