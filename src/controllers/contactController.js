const Contact = require("../models/Contact");
const User = require("../models/User");

// ➕ ADD CONTACT
exports.addContact = async (req, res) => {
    try {
        const {
            name,
            phone,
            relationship,
        } = req.body;

        const userId = req.user.id;

        if (!name || !phone) {
            return res.status(400).json({
                message: "Name and phone number are required",
            });
        }

        // Find current logged-in user
        const currentUser = await User.findById(userId);

        if (!currentUser) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        // Prevent user from adding themselves
        if (currentUser.phoneNumber === phone) {
            return res.status(400).json({
                message:
                    "You cannot add yourself as a trusted contact",
            });
        }

        // Check whether this phone number belongs
        // to an existing Salema user
        const registeredUser = await User.findOne({
            phoneNumber: phone,
        });

        // Prevent duplicate contact
        const existingContact = await Contact.findOne({
            userId,
            phone,
        });

        if (existingContact) {
            return res.status(400).json({
                message:
                    "This contact has already been added",
            });
        }

        // Create contact
        const contact = new Contact({
            userId,

            // If registered, link the Salema account.
            // Otherwise leave null.
            contactUserId: registeredUser
                ? registeredUser._id
                : null,

            name,
            phone,
            relationship: relationship || "friend",
        });

        await contact.save();

        return res.status(201).json({
            message: registeredUser
                ? "Contact added and linked to Salema user"
                : "Contact added successfully",

            contact,

            registeredOnSalema: !!registeredUser,
        });

    } catch (error) {
        console.error("ADD CONTACT ERROR:", error);

        return res.status(500).json({
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
        })
            .populate(
                "contactUserId",
                "fullName email phoneNumber pushToken"
            )
            .sort({ createdAt: -1 });

        res.json(contacts);

    } catch (error) {
        console.error("GET CONTACTS ERROR:", error);

        res.status(500).json({
            message: "Error fetching contacts",
        });
    }
};


// ❌ DELETE CONTACT
exports.deleteContact = async (req, res) => {
    try {
        const contact = await Contact.findById(
            req.params.id
        );

        if (!contact) {
            return res.status(404).json({
                message: "Contact not found",
            });
        }

        // Make sure this contact belongs
        // to the logged-in user
        if (
            contact.userId.toString() !==
            req.user.id.toString()
        ) {
            return res.status(403).json({
                message: "Not authorized",
            });
        }

        await contact.deleteOne();

        res.json({
            message: "Contact deleted",
        });

    } catch (error) {
        console.error("DELETE CONTACT ERROR:", error);

        res.status(500).json({
            message: "Delete failed",
        });
    }
};


// ✏️ UPDATE CONTACT
exports.updateContact = async (req, res) => {
    try {
        const contact = await Contact.findById(
            req.params.id
        );

        if (!contact) {
            return res.status(404).json({
                message: "Contact not found",
            });
        }

        // Make sure this contact belongs
        // to the logged-in user
        if (
            contact.userId.toString() !==
            req.user.id.toString()
        ) {
            return res.status(403).json({
                message: "Not authorized",
            });
        }

        const {
            name,
            phone,
            relationship,
        } = req.body;

        if (name !== undefined) {
            contact.name = name;
        }

        if (relationship !== undefined) {
            contact.relationship = relationship;
        }

        // If phone changes, check whether the
        // new phone belongs to a Salema user
        if (phone !== undefined) {
            const registeredUser = await User.findOne({
                phoneNumber: phone,
            });

            contact.phone = phone;

            contact.contactUserId = registeredUser
                ? registeredUser._id
                : null;
        }

        await contact.save();

        res.json({
            message: "Contact updated",

            registeredOnSalema:
                !!contact.contactUserId,

            contact,
        });

    } catch (error) {
        console.error("UPDATE CONTACT ERROR:", error);

        res.status(500).json({
            message: "Update failed",
        });
    }
};

