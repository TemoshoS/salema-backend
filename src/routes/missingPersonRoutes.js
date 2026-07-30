const express = require("express");
const router = express.Router();

const {
  createMissingPerson,
  getMissingPeople,
  getMissingPerson,
  updateMissingPerson,
  markAsFound,
  deleteMissingPerson,
} = require("../controllers/missingPersonController");

// ➕ Report Missing Person
router.post("/", createMissingPerson);

// 📋 Get All Missing People
router.get("/", getMissingPeople);

// 👤 Get Single Missing Person
router.get("/:id", getMissingPerson);

// ✏️ Update Missing Person
router.put("/:id", updateMissingPerson);

// ✅ Mark as Found
router.patch("/:id/found", markAsFound);

// ❌ Delete Missing Person
router.delete("/:id", deleteMissingPerson);

module.exports = router;