const express = require("express");

const router = express.Router();

const {
  registerSecurity,
  loginSecurity,
  verifySecurityOtp,
} = require("../controllers/securityController");

router.post("/register", registerSecurity);

router.post("/login", loginSecurity);

router.post("/verify-otp", verifySecurityOtp);

module.exports = router;