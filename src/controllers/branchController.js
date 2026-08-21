const Branch = require("../models/Branch");
const SecurityOfficer = require("../models/SecurityOfficer");

// ==========================================
// Create Branch
// ==========================================

exports.createBranch = async (req, res) => {
  try {
    const {
      branchName,
      branchCode,
      address,
      phoneNumber,
      contactPerson,
    } = req.body;

    const companyId = req.user.id;

    if (
      !branchName ||
      !branchCode ||
      !address ||
      !phoneNumber ||
      !contactPerson
    ) {
      return res.status(400).json({
        message: "All branch fields are required",
      });
    }

    const existingBranch = await Branch.findOne({
      companyId,
      branchCode: branchCode.trim(),
    });

    if (existingBranch) {
      return res.status(400).json({
        message: "A branch with this code already exists",
      });
    }

    const branch = await Branch.create({
      companyId,
      branchName,
      branchCode,
      address,
      phoneNumber,
      contactPerson,
    });

    res.status(201).json({
      message: "Branch created successfully",
      branch,
    });
  } catch (error) {
    console.error("Create branch error:", error);

    res.status(500).json({
      message: "Failed to create branch",
      error: error.message,
    });
  }
};

// ==========================================
// Get All Branches
// ==========================================

exports.getBranches = async (req, res) => {
  try {
    const companyId = req.user.id;

    const branches = await Branch.find({
      companyId,
    }).sort({
      createdAt: -1,
    });

    const branchesWithOfficerCount = await Promise.all(
      branches.map(async (branch) => {
        const officerCount = await SecurityOfficer.countDocuments({
          companyId,
          branchId: branch._id,
          status: "active",
        });

        return {
          ...branch.toObject(),
          officerCount,
        };
      })
    );

    res.status(200).json({
      branches: branchesWithOfficerCount,
    });
  } catch (error) {
    console.error("Get branches error:", error);

    res.status(500).json({
      message: "Failed to load branches",
      error: error.message,
    });
  }
};

// ==========================================
// Get Single Branch
// ==========================================

exports.getBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.id;

    const branch = await Branch.findOne({
      _id: id,
      companyId,
    });

    if (!branch) {
      return res.status(404).json({
        message: "Branch not found",
      });
    }

    const officers = await SecurityOfficer.find({
      companyId,
      branchId: branch._id,
    }).select("-password");

    res.status(200).json({
      branch,
      officers,
    });
  } catch (error) {
    console.error("Get branch error:", error);

    res.status(500).json({
      message: "Failed to load branch",
      error: error.message,
    });
  }
};

// ==========================================
// Update Branch
// ==========================================

exports.updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.id;

    const {
      branchName,
      branchCode,
      address,
      phoneNumber,
      contactPerson,
      status,
    } = req.body;

    const branch = await Branch.findOne({
      _id: id,
      companyId,
    });

    if (!branch) {
      return res.status(404).json({
        message: "Branch not found",
      });
    }

    if (branchCode) {
      const existingBranch = await Branch.findOne({
        companyId,
        branchCode: branchCode.trim(),
        _id: { $ne: id },
      });

      if (existingBranch) {
        return res.status(400).json({
          message: "A branch with this code already exists",
        });
      }
    }

    branch.branchName = branchName ?? branch.branchName;
    branch.branchCode = branchCode ?? branch.branchCode;
    branch.address = address ?? branch.address;
    branch.phoneNumber = phoneNumber ?? branch.phoneNumber;
    branch.contactPerson =
      contactPerson ?? branch.contactPerson;
    branch.status = status ?? branch.status;

    await branch.save();

    res.status(200).json({
      message: "Branch updated successfully",
      branch,
    });
  } catch (error) {
    console.error("Update branch error:", error);

    res.status(500).json({
      message: "Failed to update branch",
      error: error.message,
    });
  }
};

// ==========================================
// Delete Branch
// ==========================================

exports.deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.id;

    const branch = await Branch.findOne({
      _id: id,
      companyId,
    });

    if (!branch) {
      return res.status(404).json({
        message: "Branch not found",
      });
    }

    const assignedOfficers =
      await SecurityOfficer.countDocuments({
        companyId,
        branchId: branch._id,
      });

    if (assignedOfficers > 0) {
      return res.status(400).json({
        message:
          "Cannot delete a branch with assigned officers. Reassign the officers first.",
      });
    }

    await Branch.deleteOne({
      _id: id,
      companyId,
    });

    res.status(200).json({
      message: "Branch deleted successfully",
    });
  } catch (error) {
    console.error("Delete branch error:", error);

    res.status(500).json({
      message: "Failed to delete branch",
      error: error.message,
    });
  }
};