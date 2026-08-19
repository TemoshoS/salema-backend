const jwt = require("jsonwebtoken");
const SecurityCompany = require("../models/SecurityCompany");

const authCompany = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        message: "Access denied. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const company = await SecurityCompany.findById(
      decoded.id
    );

    if (!company) {
      return res.status(401).json({
        message: "Security company not found.",
      });
    }

    req.company = company;

    next();
  } catch (error) {
    console.error(error);

    return res.status(401).json({
      message: "Invalid or expired token.",
    });
  }
};

module.exports = authCompany;