const bcrypt = require("bcryptjs");
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