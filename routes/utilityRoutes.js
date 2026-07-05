const express = require("express");

const router = express.Router();

const protect = require("../middleware/auth");

const {
  generateSecurePassword,
} = require("../controllers/UtilityController");

router.post(
  "/generate-password",
  protect,
  generateSecurePassword
);

module.exports = router;