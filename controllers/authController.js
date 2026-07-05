const {
  registerUser,
  loginUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
} = require("../services/authService");

/* ===========================================
   REGISTER
=========================================== */
const register = async (req, res) => {
  try {
    const user = await registerUser(req.body);

    res.status(201).json({
      success: true,
      message: "Registration successful. Please verify your email.",
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
   LOGIN
=========================================== */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const data = await loginUser(email, password);

    res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===========================================
   VERIFY EMAIL
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
   FORGOT PASSWORD
=========================================== */
const forgotUserPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const result = await forgotPassword(email);

    res.status(200).json({
      success: true,
      message: "Password reset token generated.",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===========================================
   RESET PASSWORD
=========================================== */
const resetUserPassword = async (req, res) => {
  try {
    const { password } = req.body;

    await resetPassword(req.params.token, password);

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

module.exports = {
  register,
  login,
  verifyUserEmail,
  forgotUserPassword,
  resetUserPassword,
};