const express = require("express");

const router = express.Router();

const authCompany = require("../middleware/authCompany");
const authOfficer = require("../middleware/authOfficer");


const controller = require("../controllers/securityOfficerController");
router.post(
    "/login",
    controller.loginOfficer
);
router.post("/", authCompany, controller.createOfficer);

router.get("/", authCompany, controller.getOfficers);

router.put("/:id", authCompany, controller.updateOfficer);

router.patch("/status", authOfficer, controller.updateOfficerStatus);

router.delete("/:id", authCompany, controller.deleteOfficer);

router.get("/:id",authCompany,controller.getOfficer);


module.exports = router;