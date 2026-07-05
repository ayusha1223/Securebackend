const express = require("express");
const { body } = require("express-validator");

const router = express.Router();

const validate = require("../middleware/validate");
const loginLimiter = require("../middleware/rateLimiter");

const {
  register,
  login,
  verifyUserEmail,
} = require("../controllers/AuthController");

const {
  refreshToken,
} = require("../controllers/TokenController");

/* Register */
router.post(
  "/register",
  [
    body("firstName").trim().notEmpty(),
    body("lastName").trim().notEmpty(),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }),
  ],
  validate,
  register
);

/* Login */
router.post(
  "/login",
  loginLimiter,
  [
    body("email").isEmail().normalizeEmail(),
    body("password").notEmpty(),
  ],
  validate,
  login
);

/* Refresh Token */
router.post("/refresh-token", refreshToken);

/* Verify Email */
router.get("/verify-email/:token", verifyUserEmail);

module.exports = router;