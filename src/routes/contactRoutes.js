const express = require("express");
const router = express.Router();

const contactController = require("../controllers/contactController");

router.post("/add", contactController.addContact);
router.get("/user/:userId", contactController.getUserContacts);
router.delete("/:id", contactController.deleteContact);
router.put("/:id", contactController.updateContact);

module.exports = router;