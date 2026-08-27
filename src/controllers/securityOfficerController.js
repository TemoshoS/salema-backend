const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const SecurityOfficer = require("../models/SecurityOfficer");

exports.createOfficer = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      idNumber,
      psiraNumber,
      rank,  
      password,
    } = req.body;

    const companyId = req.company._id;

    const exists = await SecurityOfficer.findOne({
      email,
    });

    if (exists) {
      return res.status(400).json({
        message: "Officer already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const officer = await SecurityOfficer.create({
      companyId,
      firstName,
      lastName,
      email,
      phoneNumber,
      idNumber,
      psiraNumber,
      rank,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "Officer created successfully.",
      officer,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server error.",
    });
  }
};

// ==========================================
// OFFICER LOGIN
// ==========================================

exports.loginOfficer = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    // ==========================================
    // FIND OFFICER
    // ==========================================

    const officer = await SecurityOfficer.findOne({
      email: email.toLowerCase().trim(),
    }).populate(
      "companyId",
      "companyName email phoneNumber"
    );

    if (!officer) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // ==========================================
    // CHECK OFFICER STATUS
    // ==========================================

    if (officer.status !== "active") {
      return res.status(403).json({
        message:
          "Your officer account is inactive. Please contact your security company.",
      });
    }

    // ==========================================
    // CHECK PASSWORD
    // ==========================================

    const passwordMatch = await bcrypt.compare(
      password,
      officer.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // ==========================================
    // CREATE JWT
    // ==========================================

    const token = jwt.sign(
      {
        officerId: officer._id,
        companyId: officer.companyId?._id,
        role: "security_officer",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      message: "Officer login successful.",

      token,

      officer: {
        id: officer._id,
        firstName: officer.firstName,
        lastName: officer.lastName,
        email: officer.email,
        phoneNumber: officer.phoneNumber,
        rank: officer.rank,
        status: officer.status,

        company: officer.companyId
          ? {
              id: officer.companyId._id,
              name: officer.companyId.companyName,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("OFFICER LOGIN ERROR:", error);

    return res.status(500).json({
      message: "Failed to login officer.",
      error: error.message,
    });
  }
};

exports.getOfficers = async (req, res) => {

    try {
  
      const officers = await SecurityOfficer.find({
        companyId: req.company._id,
      }).sort({
        createdAt: -1,
      });
  
      res.json(officers);
  
    } catch {
  
      res.status(500).json({
        message: "Server error",
      });
  
    }
  
  };

  exports.deleteOfficer = async (req, res) => {

    try {
  
      await SecurityOfficer.findOneAndDelete({
        _id: req.params.id,
        companyId: req.company._id,
      });
  
      res.json({
        message: "Officer deleted.",
      });
  
    } catch {
  
      res.status(500).json({
        message: "Server error",
      });
  
    }
  
  };

  exports.updateOfficer = async (req, res) => {

    try {
  
      const officer = await SecurityOfficer.findOneAndUpdate(
        {
          _id: req.params.id,
          companyId: req.company._id,
        },
        req.body,
        {
          new: true,
        }
      );
  
      res.json({
        message: "Officer updated.",
        officer,
      });
  
    } catch {
  
      res.status(500).json({
        message: "Server error",
      });
  
    }
  
  };

  exports.getOfficer = async (req, res) => {
    try {
      const officer = await SecurityOfficer.findOne({
        _id: req.params.id,
        companyId: req.company._id,
      });
  
      if (!officer) {
        return res.status(404).json({
          message: "Officer not found.",
        });
      }
  
      res.json(officer);
    } catch (err) {
      console.error(err);
  
      res.status(500).json({
        message: "Server error.",
      });
    }
  };

  exports.updateOfficerStatus = async (req, res) => {
    try {
      const { status } = req.body;
  
      if (!["active", "inactive"].includes(status)) {
        return res.status(400).json({
          message: "Invalid status",
        });
      }
  
      req.officer.status = status;
  
      await req.officer.save();
  
      return res.status(200).json({
        message: "Officer status updated successfully",
        officer: req.officer,
      });
    } catch (error) {
      console.error("UPDATE OFFICER STATUS ERROR:", error);
  
      return res.status(500).json({
        message: "Failed to update officer status",
      });
    }
  };