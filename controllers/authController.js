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
   Login
=========================================== */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await loginUser(email, password);

    await createAuditLog({
  user: result.user.id,
  action: "LOGIN",
  resource: "Authentication",
  req,
});

    res.status(200).json({
      success: true,
      message: "Login successful",
      ...result,
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

    res.status(200).json({
      success: true,
      message: "Password reset email sent.",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
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
    const user = req.user ? req.user._id : null;

if (user) {
  await createAuditLog({
    user,
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
    await verifyMFA(req.user._id, req.body.otp);

    res.status(200).json({
      success: true,
      message: "OTP verified successfully.",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  verifyUserEmail,
  forgotUserPassword,
  resetUserPassword,
  enableUserMFA,
  sendUserMFA,
  verifyUserMFA,
};