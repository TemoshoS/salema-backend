const SecurityCompany = require("../models/SecurityCompany");

// REGISTER COMPANY
exports.registerCompany = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      address,
      city,
      province,
      description,
    } = req.body;

    const company = new SecurityCompany({
      name,
      phone,
      email,
      address,
      city,
      province,
      description,
    });

    await company.save();

    res.status(201).json({
      message: "Security company registered successfully",
      company,
    });
  } catch (error) {
    res.status(500).json({
      message: "Registration failed",
      error: error.message,
    });
  }
};

// GET ALL COMPANIES
exports.getCompanies = async (req, res) => {
  try {
    const companies = await SecurityCompany.find({
      active: true,
    });

    res.json(companies);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch companies",
    });
  }
};

// GET COMPANY BY ID
exports.getCompany = async (req, res) => {
  try {
    const company = await SecurityCompany.findById(
      req.params.id
    );

    if (!company) {
      return res.status(404).json({
        message: "Company not found",
      });
    }

    res.json(company);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
};

// UPDATE COMPANY
exports.updateCompany = async (req, res) => {
  try {
    const company = await SecurityCompany.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    );

    res.json({
      message: "Company updated",
      company,
    });
  } catch (error) {
    res.status(500).json({
      message: "Update failed",
    });
  }
};

// DELETE COMPANY
exports.deleteCompany = async (req, res) => {
  try {
    await SecurityCompany.findByIdAndDelete(
      req.params.id
    );

    res.json({
      message: "Company deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: "Delete failed",
    });
  }
};