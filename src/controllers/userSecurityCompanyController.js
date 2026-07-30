const UserSecurityCompany = require("../models/UserSecurityCompany");

// ADD COMPANY TO USER
exports.addCompany = async (req, res) => {
  try {
    const { userId, companyId } = req.body;

    const existing = await UserSecurityCompany.findOne({ userId });

    if (existing) {
      existing.companyId = companyId;
      await existing.save();

      return res.json({
        message: "Security company updated successfully",
        company: existing,
      });
    }

    const company = new UserSecurityCompany({
      userId,
      companyId,
    });

    await company.save();

    res.status(201).json({
      message: "Security company selected successfully",
      company,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
// GET USER COMPANIES
exports.getUserCompanies = async (req, res) => {
  try {
    const company = await UserSecurityCompany.findOne({
      userId: req.params.userId,
    }).populate("companyId");

    res.json(company);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch company",
    });
  }
};

// REMOVE COMPANY
exports.removeCompany = async (req, res) => {
  try {
    await UserSecurityCompany.findOneAndDelete({
      userId: req.params.userId,
      companyId: req.params.companyId,
    });

    res.json({
      message: "Company removed",
    });
  } catch (error) {
    res.status(500).json({
      message: "Delete failed",
    });
  }
};