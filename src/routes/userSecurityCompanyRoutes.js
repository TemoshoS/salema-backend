const express = require("express");

const router = express.Router();

const controller = require(
  "../controllers/userSecurityCompanyController"
);

router.post("/add", controller.addCompany);

router.get(
  "/user/:userId",
  controller.getUserCompanies
);

router.delete(
  "/:userId/:companyId",
  controller.removeCompany
);

module.exports = router;