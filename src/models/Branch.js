const mongoose = require("mongoose");

const branchSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SecurityCompany",
      required: true,
    },

    branchName: {
      type: String,
      required: true,
      trim: true,
    },

    branchCode: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },

    contactPerson: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

branchSchema.index(
  { companyId: 1, branchCode: 1 },
  { unique: true }
);

module.exports = mongoose.model("Branch", branchSchema);