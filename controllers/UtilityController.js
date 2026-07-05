const { generatePassword } = require("../utils/passwordGenerator");

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

module.exports = {
  generateSecurePassword,
};