const { generatePassword } = require("../utils/passwordGenerator");
const { analyzePassword } = require("../utils/passwordStrength");

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

module.exports = {
  generateSecurePassword,
  checkPasswordStrength,
};