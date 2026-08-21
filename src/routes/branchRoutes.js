const express = require("express");
const router = express.Router();

const {
    createBranch,
    getBranches,
    getBranch,
    updateBranch,
    deleteBranch,
} = require("../controllers/branchController");

const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, createBranch);

router.get("/", authMiddleware, getBranches);

router.get("/:id", authMiddleware, getBranch);

router.patch("/:id", authMiddleware, updateBranch);

router.delete("/:id", authMiddleware, deleteBranch);

module.exports = router;