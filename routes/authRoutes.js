const express = require("express");
const { body } = require("express-validator");

const router = express.Router();

const validate = require("../middleware/validate");
const loginLimiter = require("../middleware/rateLimiter");
const protect = require("../middleware/auth");

const {
  register,
  login,
  verifyUserEmail,
  forgotUserPassword,
  resetUserPassword,
  enableUserMFA,
  sendUserMFA,
  verifyUserMFA,
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
    body("firstName").trim().notEmpty(),
    body("lastName").trim().notEmpty(),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }),
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
    body("email").isEmail().normalizeEmail(),
    body("password").notEmpty(),
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
router.get(
  "/verify-email/:token",
  verifyUserEmail
);

/* ===========================================
   Forgot Password
=========================================== */
router.post(
  "/forgot-password",
  [
    body("email").isEmail().normalizeEmail(),
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
    body("password").isLength({ min: 8 }),
  ],
  validate,
  resetUserPassword
);

/* ===========================================
   Enable MFA
=========================================== */
router.post(
  "/mfa/enable",
  protect,
  enableUserMFA
);

/* ===========================================
   Send OTP
=========================================== */
router.post(
  "/mfa/send",
  protect,
  sendUserMFA
);

/* ===========================================
   Verify OTP
=========================================== */
router.post(
  "/mfa/verify",
  protect,
  [
    body("otp")
      .isLength({ min: 6, max: 6 })
      .withMessage("OTP must be 6 digits"),
  ],
  validate,
  verifyUserMFA
);

module.exports = router;