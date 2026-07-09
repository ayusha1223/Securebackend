const User = require("../models/User");

const {
  registerUser,
  loginUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
  enableMFA,
  sendMFA,
  verifyMFA,
} = require("../services/authService");

const {
  createAuditLog,
} = require("../services/auditService");

const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/generateToken");

/* ===========================================
   Register
=========================================== */
const register = async (req, res) => {
  try {
    const user = await registerUser(req.body);

    res.status(201).json({
      success: true,
      message: "Registration successful. Verification email sent.",
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
/* ===========================================
   Resend MFA OTP
=========================================== */
const resendUserMFA = async (req, res) => {
  try {
    const { userId } = req.body;

    await sendMFA(userId);

    res.status(200).json({
      success: true,
      message: "OTP resent successfully.",
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===========================================
   Login
=========================================== */
const login = async (req, res) => {
  try {
    const {
  email,
  password,
  captchaToken,
} = req.body;

const result = await loginUser(
  email,
  password,
  captchaToken
);

    if (result.requiresMFA) {
      return res.status(200).json({
        success: true,
        requiresMFA: true,
        userId: result.userId,
        email: result.email,
        message: "OTP sent to your email.",
      });
    }

    await createAuditLog({
      user: result.user.id,
      action: "LOGIN",
      resource: "Authentication",
      req,
    });

    res
  .cookie("accessToken", result.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    maxAge: 15 * 60 * 1000,
  })
  .cookie("refreshToken", result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
  .status(200)
 .json({
  success: true,
  message: "Login successful",
  requiresMFA: false,
  accessToken: result.accessToken,
  refreshToken: result.refreshToken,
  user: result.user,
});

  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===========================================
   Verify Email
=========================================== */
const verifyUserEmail = async (req, res) => {
  try {
    await verifyEmail(req.params.token);

    res.status(200).json({
      success: true,
      message: "Email verified successfully.",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===========================================
   Forgot Password
=========================================== */
const forgotUserPassword = async (req, res) => {
  try {
    await forgotPassword(req.body.email);
  } catch (error) {
    // Swallow deliberately - never leak existence via error content
  }

  res.status(200).json({
    success: true,
    message: "If an account exists for that email, a reset link has been sent.",
  });
};

/* ===========================================
   Reset Password
=========================================== */
const resetUserPassword = async (req, res) => {
  try {
    await resetPassword(
      req.params.token,
      req.body.password
    );

    if (req.user) {
      await createAuditLog({
        user: req.user._id,
        action: "PASSWORD_RESET",
        resource: "Authentication",
        req,
      });
    }

    res.status(200).json({
      success: true,
      message: "Password reset successfully.",
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===========================================
   Enable MFA
=========================================== */
const enableUserMFA = async (req, res) => {
  try {
    await enableMFA(req.user._id);

    res.status(200).json({
      success: true,
      message: "MFA enabled.",
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===========================================
   Send MFA OTP
=========================================== */
const sendUserMFA = async (req, res) => {
  try {
    await sendMFA(req.user._id);

    res.status(200).json({
      success: true,
      message: "OTP sent successfully.",
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===========================================
   Verify MFA OTP
=========================================== */
const verifyUserMFA = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    await verifyMFA(userId, otp);

    const user = await User.findById(userId);

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    await createAuditLog({
      user: user._id,
      action: "LOGIN",
      resource: "Authentication",
      req,
    });

   res
  .cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    maxAge: 15 * 60 * 1000,
  })
  .cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
  .status(200)
  .json({
  success: true,
  message: "Login successful.",
  accessToken,
  refreshToken,
  user: {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
  },
});

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===========================================
   Logout
=========================================== */
const logout = async (req, res) => {
  try {
    if (req.user) {
      req.user.refreshToken = null;
      await req.user.save();

      await createAuditLog({
        user: req.user._id,
        action: "LOGOUT",
        resource: "Authentication",
        req,
      });
    }

    res
      .clearCookie("accessToken", {
        httpOnly: true,
        sameSite: "Strict",
        secure: process.env.NODE_ENV === "production",
      })
      .clearCookie("refreshToken", {
        httpOnly: true,
        sameSite: "Strict",
        secure: process.env.NODE_ENV === "production",
      })
      .status(200)
      .json({
        success: true,
        message: "Logged out successfully.",
      });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
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
};