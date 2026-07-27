const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const validate = require("../middleware/validate");
const {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  mfaVerifyLimiter,
  mfaSendLimiter,
  mfaResendLimiter,
} = require("../middleware/rateLimiter");
const protect = require("../middleware/auth");
const { passwordPolicy } = require("../middleware/validators");

const {
  register,
  login,
  logout,
  verifyUserEmail,
  forgotUserPassword,
  resetUserPassword,
  enableUserMFA,
  sendUserMFA,
  resendUserMFA,
  verifyUserMFA,
} = require("../controllers/AuthController");

const {
  refreshToken,
} = require("../controllers/TokenController");


router.post(
  "/register",
  registerLimiter,
  [
    body("firstName").trim().notEmpty(),
    body("lastName").trim().notEmpty(),
    body("email").isEmail().normalizeEmail(),
    ...passwordPolicy("password"),
  ],
  validate,
  register
);

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
router.post("/logout", protect, logout);
router.post("/refresh-token", refreshToken);

router.get(
  "/verify-email/:token",
  verifyUserEmail
);

router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  [
    body("email").isEmail().normalizeEmail(),
  ],
  validate,
  forgotUserPassword
);

router.post(
  "/reset-password/:token",
  resetPasswordLimiter,
  [...passwordPolicy("password")],
  validate,
  resetUserPassword
);


router.post(
  "/mfa/enable",
  protect,
  enableUserMFA
);

router.post(
  "/mfa/send",
  protect,
  mfaSendLimiter,
  sendUserMFA
);

router.post(
  "/mfa/resend",
  mfaResendLimiter,
  [
    body("mfaToken")
      .isHexadecimal()
      .isLength({ min: 64, max: 64 })
      .withMessage("Invalid MFA session"),
  ],
  validate,
  resendUserMFA
);

router.post(
  "/mfa/verify",
  mfaVerifyLimiter,
  [
    body("mfaToken")
      .isHexadecimal()
      .isLength({ min: 64, max: 64 })
      .withMessage("Invalid MFA session"),
    body("otp")
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage("OTP must be 6 digits"),
  ],
  validate,
  verifyUserMFA
);

module.exports = router;