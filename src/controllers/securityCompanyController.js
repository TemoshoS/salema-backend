const bcrypt = require("bcryptjs");
const SecurityCompany = require("../models/SecurityCompany");
const jwt = require("jsonwebtoken");
const {
  sendCompanyRegistrationEmail,
  sendCompanyApprovedEmail,
  sendCompanyRejectedEmail,
  sendLoginOtpEmail,
  sendPasswordResetEmail,
  sendResendOtpEmail,
} = require("../utils/email");


// =============================
// Register Security Company
// =============================

exports.registerSecurityCompany = async (req, res) => {
  try {
    const {
      companyName,
      email,
      phoneNumber,
      psiraCompanyNumber,
      registrationNumber,
      address,
      contactPerson,
      password,
      confirmPassword,
    } = req.body;

    if (
      !companyName ||
      !email ||
      !phoneNumber ||
      !psiraCompanyNumber ||
      !registrationNumber ||
      !address ||
      !contactPerson ||
      !password ||
      !confirmPassword
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    // Normalize values
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPsira = psiraCompanyNumber.trim();
    const normalizedRegistration = registrationNumber.trim();

    // Check email
    const existingEmail = await SecurityCompany.findOne({
      email: normalizedEmail,
    });

    if (existingEmail) {
      return res.status(409).json({
        message: "Email already exists.",
      });
    }

    // Check PSIRA number
    const existingPsira = await SecurityCompany.findOne({
      psiraCompanyNumber: normalizedPsira,
    });

    if (existingPsira) {
      return res.status(409).json({
        message: "PSIRA Company Number already exists.",
      });
    }

    // Check registration number
    const existingRegistration = await SecurityCompany.findOne({
      registrationNumber: normalizedRegistration,
    });

    if (existingRegistration) {
      return res.status(409).json({
        message: "Registration Number already exists.",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(
      password,
      salt
    );

    // Create company
    const company = await SecurityCompany.create({
      companyName: companyName.trim(),
      email: normalizedEmail,
      phoneNumber: phoneNumber.trim(),
      psiraCompanyNumber: normalizedPsira,
      registrationNumber: normalizedRegistration,
      address: address.trim(),
      contactPerson: contactPerson.trim(),
      password: hashedPassword,
      role: "security_company",
      approvalStatus: "pending",
    });
    await sendCompanyRegistrationEmail(company);

    return res.status(201).json({
      message:
        "Registration successful. Your account is pending admin approval.",
      company: {
        id: company._id,
        companyName: company.companyName,
        email: company.email,
        phoneNumber: company.phoneNumber,
        role: company.role,
        approvalStatus: company.approvalStatus,
        createdAt: company.createdAt,
      },
    });

  } catch (error) {

    console.error("Registration error:", error);

    // MongoDB duplicate-key protection
    if (error.code === 11000) {

      const duplicateField =
        Object.keys(error.keyPattern || {})[0];

      if (duplicateField === "email") {
        return res.status(409).json({
          message: "Email already exists.",
        });
      }

      if (duplicateField === "psiraCompanyNumber") {
        return res.status(409).json({
          message: "PSIRA Company Number already exists.",
        });
      }

      if (duplicateField === "registrationNumber") {
        return res.status(409).json({
          message: "Registration Number already exists.",
        });
      }

      return res.status(409).json({
        message: "Some registration details already exist.",
      });
    }

    return res.status(500).json({
      message: "Unable to register security company.",
    });
  }
};



// =============================
// Login Security Company
// =============================

exports.loginSecurityCompany = async (req, res) => {

  try {

    const {
      email,
      password
    } = req.body;



    const company = await SecurityCompany.findOne({
      email
    });



    if (!company) {

      return res.status(400).json({
        message: "Invalid credentials"
      });

    }



    const isMatch = await bcrypt.compare(
      password,
      company.password
    );



    if (!isMatch) {

      return res.status(400).json({
        message: "Invalid credentials"
      });

    }
    // =============================
// ADMIN APPROVAL CHECK
// =============================

if (company.approvalStatus === "pending") {
  return res.status(403).json({
    message:
      "Your security company account is still pending admin approval.",
    approvalStatus: "pending",
  });
}

if (company.approvalStatus === "rejected") {
  return res.status(403).json({
    message:
      "Your security company registration has been rejected by the administrator.",
    approvalStatus: "rejected",
  });
}



    const now = new Date();


    const needsOtp =
      !company.lastOtpVerifiedAt ||
      now - company.lastOtpVerifiedAt >=
      24 * 60 * 60 * 1000;



    if (!needsOtp) {


      const token = jwt.sign(
        {
          id: company._id,
          role: company.role
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "7d"
        }
      );


      return res.json({

        message: "Login successful",

        token,

        company: {
          id: company._id,
          companyName: company.companyName,
          email: company.email,
          role: company.role
        }

      });

    }



    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();



    company.otp = otp;

    company.otpExpires =
      Date.now() + 5 * 60 * 1000;



    await company.save();



    await sendLoginOtpEmail(company, otp);



    res.json({

      message: "OTP sent to email",

      requiresOtp: true

    });



  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};



// =============================
// Verify OTP
// =============================

exports.verifyOtp = async (req, res) => {

  try {

    const {
      email,
      otp
    } = req.body;



    const company =
      await SecurityCompany.findOne({
        email
      });



    if (!company) {

      return res.status(404).json({
        message: "Company not found"
      });

    }



    if (String(company.otp) !== String(otp)) {

      return res.status(400).json({
        message: "Invalid OTP"
      });

    }



    if (company.otpExpires < Date.now()) {

      return res.status(400).json({
        message: "OTP expired"
      });

    }



    company.otp = null;
    company.otpExpires = null;
    company.isVerified = true;
    company.lastOtpVerifiedAt = new Date();



    await company.save();



    const token = jwt.sign(

      {
        id: company._id,
        role: company.role
      },

      process.env.JWT_SECRET,

      {
        expiresIn: "7d"
      }

    );



    res.json({

      message: "Login successful",

      token,

      company: {
        id: company._id,
        companyName: company.companyName,
        email: company.email,
        role: company.role
      }

    });



  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};

// =============================
// Logout Security Company
// =============================

exports.logoutSecurityCompany = async (req, res) => {
  try {

    return res.status(200).json({
      message:
        "Logged out successfully. Please remove token on client."
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};



// =============================
// Change Password
// =============================

exports.changePassword = async (req, res) => {

  try {

    const {
      currentPassword,
      newPassword,
      confirmPassword
    } = req.body;



    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {

      return res.status(400).json({
        message: "All fields are required."
      });

    }



    if (newPassword !== confirmPassword) {

      return res.status(400).json({
        message: "Passwords do not match."
      });

    }



    if (newPassword.length < 6) {

      return res.status(400).json({
        message:
          "Password must be at least 6 characters."
      });

    }



    const company =
      await SecurityCompany.findById(req.user.id);



    if (!company) {

      return res.status(404).json({
        message: "Company not found."
      });

    }



    const isMatch =
      await bcrypt.compare(
        currentPassword,
        company.password
      );



    if (!isMatch) {

      return res.status(400).json({
        message:
          "Current password is incorrect."
      });

    }



    const salt =
      await bcrypt.genSalt(10);



    company.password =
      await bcrypt.hash(
        newPassword,
        salt
      );



    await company.save();



    res.json({

      message:
        "Password changed successfully."

    });



  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};



// =============================
// Forgot Password
// ========================== ===

exports.forgotPassword = async (req, res) => {

  try {

    const {
      email
    } = req.body;



    const company =
      await SecurityCompany.findOne({
        email: email.toLowerCase()
      });



    if (!company) {

      return res.status(404).json({
        message:
          "No account found with this email."
      });

    }



    const otp =
      Math.floor(
        100000 + Math.random() * 900000
      ).toString();



    company.otp = otp;

    company.otpExpires =
      Date.now() + 5 * 60 * 1000;



    await company.save();



    await sendPasswordResetEmail(company, otp);



    res.json({

      message:
        "Password reset code sent."

    });



  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};



// =============================
// Reset Password
// =============================

exports.resetPassword = async (req, res) => {

  try {

    const {
      email,
      otp,
      password,
      confirmPassword
    } = req.body;



    if (
      !email ||
      !otp ||
      !password ||
      !confirmPassword
    ) {

      return res.status(400).json({
        message:
          "All fields are required."
      });

    }



    if (password !== confirmPassword) {

      return res.status(400).json({
        message:
          "Passwords do not match."
      });

    }



    const company =
      await SecurityCompany.findOne({
        email: email.toLowerCase()
      });



    if (!company) {

      return res.status(404).json({
        message:
          "Company not found."
      });

    }



    if (String(company.otp) !== String(otp)) {

      return res.status(400).json({
        message:
          "Invalid OTP."
      });

    }



    if (company.otpExpires < Date.now()) {

      return res.status(400).json({
        message:
          "OTP expired."
      });

    }



    const salt =
      await bcrypt.genSalt(10);



    company.password =
      await bcrypt.hash(
        password,
        salt
      );



    company.otp = null;

    company.otpExpires = null;



    await company.save();



    res.json({

      message:
        "Password reset successfully."

    });



  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};

// =============================
// Resend OTP
// =============================

exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required.",
      });
    }

    const company = await SecurityCompany.findOne({
      email,
    });

    if (!company) {
      return res.status(404).json({
        message: "Security company not found.",
      });
    }

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    company.otp = otp;
    company.otpExpires = Date.now() + 5 * 60 * 1000;

    await company.save();

    await sendResendOtpEmail(company, otp);

    res.status(200).json({
      message: "OTP sent successfully.",
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// =============================
// Get Profile
// =============================

exports.getProfile = async (req, res) => {

  try {

    const company =
      await SecurityCompany
        .findById(req.user.id)
        .select("-password -otp -otpExpires");



    if (!company) {

      return res.status(404).json({
        message:
          "Company not found."
      });

    }



    res.json(company);



  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};



// =============================
// Update Profile
// =============================

exports.updateProfile = async (req, res) => {

  try {

    const {
      companyName,
      phoneNumber,
      address,
      contactPerson
    } = req.body;



    const company =
      await SecurityCompany.findById(
        req.user.id
      );



    if (!company) {

      return res.status(404).json({
        message:
          "Company not found."
      });

    }



    company.companyName =
      companyName || company.companyName;


    company.phoneNumber =
      phoneNumber || company.phoneNumber;


    company.address =
      address || company.address;


    company.contactPerson =
      contactPerson || company.contactPerson;



    await company.save();



    res.json({

      message:
        "Profile updated successfully",


      company: {

        id: company._id,

        companyName:
          company.companyName,

        email:
          company.email,

        phoneNumber:
          company.phoneNumber,

        address:
          company.address,

        contactPerson:
          company.contactPerson,

        role:
          company.role

      }

    });



  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};

// =============================
// Get All Security Companies
// =============================

exports.getAllSecurityCompanies = async (req, res) => {
  try {
    const companies = await SecurityCompany
      .find({
        approvalStatus: "approved",
      })
      .select("-password -otp -otpExpires");

    res.status(200).json({
      message:
        "Security companies retrieved successfully",
      count: companies.length,
      companies,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};