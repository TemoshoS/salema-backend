const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Security = require("../models/Security");
const sendEmail = require("../utils/email");

// =========================
// Register Security
// =========================

exports.registerSecurity = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phoneNumber,
      companyName,
      employeeNumber,
      securityGrade,
      psiraNumber,
      stationBranch,
      address,
      password,
      confirmPassword,
    } = req.body;

    if (
      !fullName ||
      !email ||
      !phoneNumber ||
      !companyName ||
      !employeeNumber ||
      !securityGrade ||
      !psiraNumber ||
      !stationBranch ||
      !address ||
      !password ||
      !confirmPassword
    ) {
      return res.status(400).json({
        message: "All fields are required.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match.",
      });
    }

    const exists = await Security.findOne({
      $or: [
        { email },
        { employeeNumber },
        { psiraNumber },
      ],
    });

    if (exists) {
      return res.status(400).json({
        message:
          "Email, Employee Number or PSIRA Number already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const security = await Security.create({
      fullName,
      email,
      phoneNumber,
      companyName,
      employeeNumber,
      securityGrade,
      psiraNumber,
      stationBranch,
      address,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "Security account created successfully.",
      security,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// =========================
// Login Security
// =========================

exports.loginSecurity = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    const security = await Security.findOne({
      email,
    });

    if (!security) {
      return res.status(400).json({
        message: "Invalid credentials.",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      security.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials.",
      });
    }

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    security.otp = otp;
    security.otpExpires = Date.now() + 5 * 60 * 1000;

    await security.save();

    await sendEmail(
      security.email,
      "Salema Security Login OTP",
      `Your OTP is ${otp}. It expires in 5 minutes.`
    );

    res.json({
      message: "OTP sent successfully.",
      requiresOtp: true,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// =========================
// Verify OTP
// =========================

exports.verifySecurityOtp = async (req, res) => {
  try {
    const {
      email,
      otp,
    } = req.body;

    const security = await Security.findOne({
      email,
    });

    if (!security) {
      return res.status(404).json({
        message: "Security account not found.",
      });
    }

    if (security.otp !== otp) {
      return res.status(400).json({
        message: "Invalid OTP.",
      });
    }

    if (security.otpExpires < Date.now()) {
      return res.status(400).json({
        message: "OTP expired.",
      });
    }

    security.otp = null;
    security.otpExpires = null;
    security.isVerified = true;
    security.lastOtpVerifiedAt = new Date();

    await security.save();

    const token = jwt.sign(
      {
        id: security._id,
        role: "security",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({
      message: "Login successful.",
      token,
      security: {
        id: security._id,
        fullName: security.fullName,
        email: security.email,
        role: "security",
      },
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};