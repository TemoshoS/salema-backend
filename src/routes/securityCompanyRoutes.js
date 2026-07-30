const express = require("express");

const router = express.Router();

const securityCompanyController = require(
  "../controllers/securityCompanyController"
);

router.post(
  "/register",
  securityCompanyController.registerCompany
);

router.get(
  "/",
  securityCompanyController.getCompanies
);

router.get(
  "/:id",
  securityCompanyController.getCompany
);

router.put(
  "/:id",
  securityCompanyController.updateCompany
);

router.delete(
  "/:id",
  securityCompanyController.deleteCompany
);

module.exports = router;