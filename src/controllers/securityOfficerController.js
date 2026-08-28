const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const SecurityOfficer = require("../models/SecurityOfficer");
const Branch = require("../models/Branch");

// ==========================================
// CREATE OFFICER
// ==========================================

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
      branchId,
    } = req.body;

    const companyId = req.company._id;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (
      !firstName ||
      !lastName ||
      !email ||
      !phoneNumber ||
      !idNumber ||
      !psiraNumber ||
      !password ||
      !branchId
    ) {
      return res.status(400).json({
        message: "All required fields must be provided.",
      });
    }

    // ==========================================
    // CHECK BRANCH
    // ==========================================

    const branch = await Branch.findOne({
      _id: branchId,
      companyId,
      status: "active",
    });

    if (!branch) {
      return res.status(400).json({
        message:
          "Invalid branch or branch does not belong to your company.",
      });
    }

    // ==========================================
    // CHECK EXISTING OFFICER
    // ==========================================

    const exists = await SecurityOfficer.findOne({
      email: email.toLowerCase().trim(),
    });

    if (exists) {
      return res.status(400).json({
        message: "Officer already exists.",
      });
    }

    // ==========================================
    // HASH PASSWORD
    // ==========================================

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // ==========================================
    // CREATE OFFICER
    // ==========================================

    const officer = await SecurityOfficer.create({
      companyId,
      branchId,

      firstName,
      lastName,
      email: email.toLowerCase().trim(),
      phoneNumber,
      idNumber,
      psiraNumber,
      rank: rank || "Security Officer",

      password: hashedPassword,

      status: "active",
    });

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(201).json({
      message: "Officer created successfully.",
      officer,
    });
  } catch (err) {
    console.error("CREATE OFFICER ERROR:", err);

    return res.status(500).json({
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
    })
      .populate(
        "branchId",
        "branchName branchCode address phoneNumber contactPerson"
      )
      .sort({
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
// ==========================================
// UPDATE OFFICER
// ==========================================

exports.updateOfficer = async (req, res) => {
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
      branchId,
      status,
    } = req.body;

    const companyId = req.company._id;

    // ==========================================
    // FIND OFFICER
    // ==========================================

    const officer = await SecurityOfficer.findOne({
      _id: req.params.id,
      companyId,
    });

    if (!officer) {
      return res.status(404).json({
        message: "Officer not found.",
      });
    }

    // ==========================================
    // CHECK BRANCH
    // ==========================================

    if (branchId) {
      const branch = await Branch.findOne({
        _id: branchId,
        companyId,
        status: "active",
      });

      if (!branch) {
        return res.status(400).json({
          message:
            "Invalid branch or branch does not belong to your company.",
        });
      }

      officer.branchId = branchId;
    }

    // ==========================================
    // UPDATE FIELDS
    // ==========================================

    if (firstName !== undefined) {
      officer.firstName = firstName.trim();
    }

    if (lastName !== undefined) {
      officer.lastName = lastName.trim();
    }

    if (email !== undefined) {
      officer.email = email.toLowerCase().trim();
    }

    if (phoneNumber !== undefined) {
      officer.phoneNumber = phoneNumber.trim();
    }

    if (idNumber !== undefined) {
      officer.idNumber = idNumber.trim();
    }

    if (psiraNumber !== undefined) {
      officer.psiraNumber = psiraNumber.trim();
    }

    if (rank !== undefined) {
      officer.rank = rank.trim();
    }

    if (status !== undefined) {
      if (!["active", "inactive"].includes(status)) {
        return res.status(400).json({
          message: "Invalid status.",
        });
      }

      officer.status = status;
    }

    // ==========================================
    // UPDATE PASSWORD
    // ==========================================

    if (password && password.trim()) {
      officer.password = await bcrypt.hash(
        password,
        10
      );
    }

    // ==========================================
    // SAVE
    // ==========================================

    await officer.save();

    // ==========================================
    // RETURN OFFICER WITH BRANCH
    // ==========================================

    await officer.populate(
      "branchId",
      "branchName branchCode address phoneNumber contactPerson"
    );

    return res.status(200).json({
      message: "Officer updated successfully.",
      officer,
    });

  } catch (error) {
    console.error(
      "UPDATE OFFICER ERROR:",
      error
    );

    return res.status(500).json({
      message: "Server error.",
    });
  }
};


// ==========================================
// GET SINGLE OFFICER
// ==========================================

exports.getOfficer = async (req, res) => {
  try {
    const officer = await SecurityOfficer.findOne({
      _id: req.params.id,
      companyId: req.company._id,
    }).populate(
      "branchId",
      "branchName branchCode address phoneNumber contactPerson"
    );

    if (!officer) {
      return res.status(404).json({
        message: "Officer not found.",
      });
    }

    return res.status(200).json(officer);

  } catch (error) {
    console.error(
      "GET OFFICER ERROR:",
      error
    );

    return res.status(500).json({
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