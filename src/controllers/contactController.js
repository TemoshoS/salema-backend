const Contact = require("../models/Contact");

// ➕ ADD CONTACT
exports.addContact = async (req, res) => {
  try {
    const { userId, name, phone, relationship } = req.body;

    const contact = new Contact({
      userId,
      name,
      phone,
      relationship,
    });

    await contact.save();

    res.status(201).json({
      message: "Contact added successfully",
      contact,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// 📥 GET USER CONTACTS
exports.getUserContacts = async (req, res) => {
  try {
    const contacts = await Contact.find({
      userId: req.params.userId,
    });

    res.json(contacts);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching contacts",
    });
  }
};

// ❌ DELETE CONTACT
exports.deleteContact = async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);

    res.json({
      message: "Contact deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: "Delete failed",
    });
  }
};

// UPDATE CONTACT
exports.updateContact = async (req, res) => {
    try {
      const updated = await Contact.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
  
      res.json({
        message: "Contact updated",
        contact: updated,
      });
    } catch (error) {
      res.status(500).json({
        message: "Update failed",
      });
    }
  };