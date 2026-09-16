const express = require("express");

const router = express.Router();

const contactController = require("../controllers/contactController");
const protect = require("../middleware/authMiddleware");

// ADD CONTACT
router.post("/add", protect, contactController.addContact);

// GET USER CONTACTS
router.get("/user/:userId", protect, contactController.getUserContacts);

// DELETE CONTACT
router.delete("/:id", protect, contactController.deleteContact);

// UPDATE CONTACT
router.put("/:id", protect, contactController.updateContact);

module.exports = router;