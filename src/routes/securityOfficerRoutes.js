const express = require("express");

const router = express.Router();

const authCompany = require("../middleware/authCompany");

const controller = require("../controllers/securityOfficerController");

router.post("/", authCompany, controller.createOfficer);

router.get("/", authCompany, controller.getOfficers);

router.put("/:id", authCompany, controller.updateOfficer);

router.delete("/:id", authCompany, controller.deleteOfficer);

router.get("/:id",authCompany,controller.getOfficer);

module.exports = router;