const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { generateAccessToken } = require("../utils/generateToken");

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_SECRET
    );

    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    const accessToken = generateAccessToken(user);

    res.status(200).json({
      success: true,
      accessToken,
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Refresh token expired",
    });
  }
};

module.exports = {
  refreshToken,
};