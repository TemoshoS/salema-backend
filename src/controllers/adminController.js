const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Admin = require("../models/Admin");
const SecurityCompany = require("../models/SecurityCompany");

const {
  sendCompanyApprovedEmail,
  sendCompanyRejectedEmail,
} = require("../utils/email");


// =====================================================
// Admin Login
// =====================================================

exports.loginAdmin = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    const admin = await Admin.findOne({
      email: normalizedEmail,
    });

    if (!admin) {
      return res.status(401).json({
        message: "Invalid credentials.",
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        message: "Admin account is inactive.",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      admin.password
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials.",
      });
    }

    const token = jwt.sign(
      {
        id: admin._id,
        role: admin.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(200).json({
      message: "Admin login successful.",
      token,
      admin: {
        id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        phoneNumber: admin.phoneNumber,
        role: admin.role,
      },
    });

  } catch (error) {
    console.error("Admin login error:", error);

    return res.status(500).json({
      message: "Unable to login.",
    });
  }
};


// =====================================================
// Create Admin
// =====================================================

exports.createAdmin = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phoneNumber,
      password,
      confirmPassword,
    } = req.body;

    if (
      !fullName ||
      !email ||
      !phoneNumber ||
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

    if (password.length < 6) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters.",
      });
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    const existingAdmin = await Admin.findOne({
      email: normalizedEmail,
    });

    if (existingAdmin) {
      return res.status(409).json({
        message: "Admin email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const admin = await Admin.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      phoneNumber: phoneNumber.trim(),
      password: hashedPassword,
      role: "admin",
    });

    return res.status(201).json({
      message: "Admin created successfully.",
      admin: {
        id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        phoneNumber: admin.phoneNumber,
        role: admin.role,
      },
    });

  } catch (error) {
    console.error("Create admin error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Admin email already exists.",
      });
    }

    return res.status(500).json({
      message: "Unable to create admin.",
    });
  }
};


// =====================================================
// Get Admin Profile
// =====================================================

exports.getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(
      req.user.id
    ).select("-password");

    if (!admin) {
      return res.status(404).json({
        message: "Admin not found.",
      });
    }

    return res.status(200).json({
      admin,
    });

  } catch (error) {
    console.error(
      "Get admin profile error:",
      error
    );

    return res.status(500).json({
      message: "Unable to retrieve admin profile.",
    });
  }
};


// =====================================================
// Get Pending Security Companies
// =====================================================

exports.getPendingSecurityCompanies = async (
  req,
  res
) => {
  try {
    const companies =
      await SecurityCompany.find({
        approvalStatus: "pending",
      })
        .select(
          "-password -otp -otpExpires"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      message:
        "Pending security companies retrieved successfully.",
      count: companies.length,
      companies,
    });

  } catch (error) {
    console.error(
      "Get pending companies error:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to retrieve pending security companies.",
    });
  }
};


// =====================================================
// Get All Security Companies
// =====================================================

exports.getAllSecurityCompanies = async (
  req,
  res
) => {
  try {
    const companies =
      await SecurityCompany.find()
        .select(
          "-password -otp -otpExpires"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      message:
        "Security companies retrieved successfully.",
      count: companies.length,
      companies,
    });

  } catch (error) {
    console.error(
      "Get all companies error:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to retrieve security companies.",
    });
  }
};


// =====================================================
// Get One Security Company
// =====================================================

exports.getSecurityCompany = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const company =
      await SecurityCompany.findById(id)
        .select(
          "-password -otp -otpExpires"
        );

    if (!company) {
      return res.status(404).json({
        message:
          "Security company not found.",
      });
    }

    return res.status(200).json({
      company,
    });

  } catch (error) {
    console.error(
      "Get security company error:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to retrieve security company.",
    });
  }
};


// =====================================================
// Approve Security Company
// =====================================================

exports.approveSecurityCompany = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const company =
      await SecurityCompany.findById(id);

    if (!company) {
      return res.status(404).json({
        message:
          "Security company not found.",
      });
    }

    if (
      company.approvalStatus ===
      "approved"
    ) {
      return res.status(400).json({
        message:
          "Security company is already approved.",
      });
    }

    company.approvalStatus = "approved";
    company.approvedAt = new Date();

    await company.save();

    // Send approval email
    await sendCompanyApprovedEmail(
      company
    );

    return res.status(200).json({
      message:
        "Security company approved successfully.",
      company: {
        id: company._id,
        companyName: company.companyName,
        email: company.email,
        approvalStatus:
          company.approvalStatus,
        approvedAt:
          company.approvedAt,
      },
    });

  } catch (error) {
    console.error(
      "Approve company error:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to approve security company.",
    });
  }
};


// =====================================================
// Reject Security Company
// =====================================================

exports.rejectSecurityCompany = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const {
      reason,
    } = req.body;

    const company =
      await SecurityCompany.findById(id);

    if (!company) {
      return res.status(404).json({
        message:
          "Security company not found.",
      });
    }

    if (
      company.approvalStatus ===
      "rejected"
    ) {
      return res.status(400).json({
        message:
          "Security company is already rejected.",
      });
    }

    company.approvalStatus = "rejected";
    company.approvedAt = null;

    await company.save();

    // Send rejection email
    await sendCompanyRejectedEmail(
      company,
      reason ||
        "Your registration did not meet the approval requirements."
    );

    return res.status(200).json({
      message:
        "Security company rejected successfully.",
      company: {
        id: company._id,
        companyName: company.companyName,
        email: company.email,
        approvalStatus:
          company.approvalStatus,
      },
    });

  } catch (error) {
    console.error(
      "Reject company error:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to reject security company.",
    });
  }
};


// =====================================================
// Logout Admin
// =====================================================

exports.logoutAdmin = async (
  req,
  res
) => {
  try {
    return res.status(200).json({
      message:
        "Logged out successfully. Please remove token on client.",
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};