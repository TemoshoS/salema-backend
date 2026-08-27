const express = require("express");
const router = express.Router();

const {
    registerSecurityCompany,
    loginSecurityCompany,
    verifyOtp,
    logoutSecurityCompany,
    changePassword,
    forgotPassword,
    resetPassword,
    resendOtp,
    getProfile,
    updateProfile,
    getAllSecurityCompanies,
    getDashboardStats,
} = require("../controllers/securityCompanyController");

const authMiddleware = require("../middleware/authMiddleware");
const authCompany = require("../middleware/authCompany")

// =============================
// Security Company Auth Routes
// =============================

// Register company
router.post(
    "/register",
    registerSecurityCompany
);


// Login company
router.post(
    "/login",
    loginSecurityCompany
);


// Verify OTP
router.post(
    "/verify-otp",
    verifyOtp
);


// Logout
router.post(
    "/logout",
    logoutSecurityCompany
);


// Forgot password
router.post(
    "/forgot-password",
    forgotPassword
);


// Reset password
router.post(
    "/reset-password",
    resetPassword
);


// Change password (protected)
router.put(
    "/change-password",
    authMiddleware,
    changePassword
);


// Get company profile (protected)
router.get(
    "/profile",
    authMiddleware,
    getProfile
);

router.post("/resend-otp", resendOtp);

// Update company profile (protected)
router.put(
    "/profile",
    authMiddleware,
    updateProfile
);

router.get("/all", getAllSecurityCompanies);


router.get(
    "/dashboard-stats",
    authCompany,
    getDashboardStats
);

module.exports = router;