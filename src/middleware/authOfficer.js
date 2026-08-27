const jwt = require("jsonwebtoken");
const SecurityOfficer = require("../models/SecurityOfficer");

const authOfficer = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authorization token required",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (
      !decoded.officerId ||
      decoded.role !== "security_officer"
    ) {
      return res.status(401).json({
        message: "Invalid officer token",
      });
    }

    const officer = await SecurityOfficer.findById(
      decoded.officerId
    );

    if (!officer) {
      return res.status(404).json({
        message: "Officer not found",
      });
    }

    req.officer = officer;

    next();
  } catch (error) {
    console.error("OFFICER AUTH ERROR:", error);

    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

module.exports = authOfficer;