const express = require("express");

const router = express.Router();

const protect = require("../middleware/auth");

const {
  generateSecurePassword,
  checkPasswordStrength,
  getSystemSettings,
} = require("../controllers/UtilityController");

router.post(
  "/generate-password",
  protect,
  generateSecurePassword
);
router.get(
  "/settings",
  protect,
  getSystemSettings
);

router.post(
  "/password-strength",
  protect,
  checkPasswordStrength
);

module.exports = router;