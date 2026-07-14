const bcrypt = require("bcrypt");
const User = require("../models/User");

/* ===========================================
   GET PROFILE
=========================================== */

const getProfile = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};

/* ===========================================
   UPDATE PROFILE
=========================================== */

const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.firstName =
      req.body.firstName || user.firstName;

    user.lastName =
      req.body.lastName || user.lastName;

    if (
      req.body.email &&
      req.body.email !== user.email
    ) {
      const exists = await User.findOne({
        email: req.body.email.toLowerCase(),
      });

      if (exists) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }

      user.email = req.body.email.toLowerCase();
    }

    await user.save();

    res.json({
      success: true,
      message: "Profile updated",
      user,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ===========================================
   CHANGE PASSWORD
=========================================== */

const changePassword = async (req, res) => {
  try {
    const {
      currentPassword,
      newPassword,
    } = req.body;

    const user = await User.findById(req.user._id);

    const match = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!match) {
      return res.status(400).json({
        success: false,
        message: "Current password incorrect",
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.lastPasswordChange = new Date();

    // Invalidate all existing sessions on password change (CWE-613).
    // Clearing the stored refresh token forces re-authentication and
    // locks out any session created before the change.
    user.refreshToken = null;

    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
};