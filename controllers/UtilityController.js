const { generatePassword } = require("../utils/passwordGenerator");
const { analyzePassword } = require("../utils/passwordStrength");
const SystemSettings = require("../models/SystemSettings");

/* ===========================================
   Generate Password
=========================================== */
const generateSecurePassword = (req, res) => {
  try {
    const password = generatePassword(req.body);

    res.status(200).json({
      success: true,
      password,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===========================================
   Password Strength
=========================================== */
const checkPasswordStrength = (req, res) => {
  try {
    const { password } = req.body;

    const result = analyzePassword(password);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===========================================
   Get System Settings
=========================================== */
const getSystemSettings = async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();

    if (!settings) {
      settings = await SystemSettings.create({});
    }

    res.status(200).json({
      success: true,
      data: {
        autoLogout: settings.autoLogout,
        loginAttempts: settings.loginAttempts,
        lockDuration: settings.lockDuration,
        passwordExpiry: settings.passwordExpiry,
        requireEmailVerification:
          settings.requireEmailVerification,
        enableMFA: settings.enableMFA,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  generateSecurePassword,
  checkPasswordStrength,
  getSystemSettings,
};