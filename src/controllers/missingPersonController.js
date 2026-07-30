const MissingPerson = require("../models/MissingPerson");

// ➕ Report Missing Person
exports.createMissingPerson = async (req, res) => {
  try {
    const {
      reportedBy,
      fullName,
      age,
      gender,
      height,
      weight,
      complexion,
      hairColor,
      eyeColor,
      clothing,
      description,
      lastSeenLocation,
      lastSeenDate,
      latitude,
      longitude,
      photo,
      contactName,
      contactNumber,
    } = req.body;

    if (
      !reportedBy ||
      !fullName ||
      !age ||
      !gender ||
      !description ||
      !lastSeenLocation ||
      !lastSeenDate ||
      !contactName ||
      !contactNumber
    ) {
      return res.status(400).json({
        message: "Please fill in all required fields.",
      });
    }

    const person = await MissingPerson.create({
      reportedBy,
      fullName,
      age,
      gender,
      height,
      weight,
      complexion,
      hairColor,
      eyeColor,
      clothing,
      description,
      lastSeenLocation,
      lastSeenDate,
      latitude,
      longitude,
      photo,
      contactName,
      contactNumber,
    });

    res.status(201).json({
      message: "Missing person reported successfully.",
      person,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// 📋 Get All Missing People
exports.getMissingPeople = async (req, res) => {
  try {
    const people = await MissingPerson.find()
      .sort({ createdAt: -1 });

    res.json(people);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// 👤 Get One Missing Person
exports.getMissingPerson = async (req, res) => {
  try {
    const person = await MissingPerson.findById(req.params.id);

    if (!person) {
      return res.status(404).json({
        message: "Missing person not found.",
      });
    }

    res.json(person);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ✏️ Update Missing Person
exports.updateMissingPerson = async (req, res) => {
  try {
    const updated = await MissingPerson.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    );

    if (!updated) {
      return res.status(404).json({
        message: "Missing person not found.",
      });
    }

    res.json({
      message: "Missing person updated successfully.",
      person: updated,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ✅ Mark as Found
exports.markAsFound = async (req, res) => {
  try {
    const person = await MissingPerson.findByIdAndUpdate(
      req.params.id,
      {
        status: "Found",
      },
      {
        new: true,
      }
    );

    if (!person) {
      return res.status(404).json({
        message: "Missing person not found.",
      });
    }

    res.json({
      message: "Person marked as found.",
      person,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ❌ Delete Missing Person
exports.deleteMissingPerson = async (req, res) => {
  try {
    const deleted = await MissingPerson.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        message: "Missing person not found.",
      });
    }

    res.json({
      message: "Missing person deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};