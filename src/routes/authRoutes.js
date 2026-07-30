const express = require("express");
const router = express.Router();
const { registerUser, loginUser, verifyOtp ,logoutUser,changePassword,forgotPassword,resetPassword,getProfile, updateProfile} = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/verify-otp", verifyOtp);
router.post("/logout", logoutUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.put("/change-password",authMiddleware,changePassword);
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);


module.exports = router;