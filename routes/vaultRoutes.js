const express = require("express");

const router = express.Router();

const protect = require("../middleware/auth");

const { addPassword } = require("../controllers/VaultController");

router.post("/", protect, addPassword);

module.exports = router;