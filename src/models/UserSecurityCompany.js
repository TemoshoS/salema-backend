const mongoose = require("mongoose");

const userSecurityCompanySchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SecurityCompany",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "UserSecurityCompany",
  userSecurityCompanySchema
);