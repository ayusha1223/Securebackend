const express = require("express");
const { body } = require("express-validator");

const router = express.Router();

const validate = require("../middleware/validate");
const loginLimiter = require("../middleware/rateLimiter");

const {
  register,
  login,
  verifyUserEmail,
  forgotUserPassword,
  resetUserPassword,
} = require("../controllers/AuthController");

const {
  refreshToken,
} = require("../controllers/TokenController");

/* ===========================================
   Register
=========================================== */
router.post(
  "/register",
  [
    body("firstName")
      .trim()
      .notEmpty()
      .withMessage("First name is required"),

    body("lastName")
      .trim()
      .notEmpty()
      .withMessage("Last name is required"),

    body("email")
      .isEmail()
      .withMessage("Valid email is required")
      .normalizeEmail(),

    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
  ],
  validate,
  register
);

/* ===========================================
   Login
=========================================== */
router.post(
  "/login",
  loginLimiter,
  [
    body("email")
      .isEmail()
      .withMessage("Valid email is required")
      .normalizeEmail(),

    body("password")
      .notEmpty()
      .withMessage("Password is required"),
  ],
  validate,
  login
);

/* ===========================================
   Refresh Token
=========================================== */
router.post("/refresh-token", refreshToken);

/* ===========================================
   Email Verification
=========================================== */
router.get("/verify-email/:token", verifyUserEmail);

/* ===========================================
   Forgot Password
=========================================== */
router.post(
  "/forgot-password",
  [
    body("email")
      .isEmail()
      .withMessage("Valid email is required")
      .normalizeEmail(),
  ],
  validate,
  forgotUserPassword
);

/* ===========================================
   Reset Password
=========================================== */
router.post(
  "/reset-password/:token",
  [
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
  ],
  validate,
  resetUserPassword
);

module.exports = router;