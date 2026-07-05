const bcrypt = require("bcrypt");
const User = require("../models/User");

const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/generateToken");

const generateVerificationToken = require("../utils/generateVerificationToken");
const generateResetToken = require("../utils/generateResetToken");

/* ===========================================
   REGISTER
=========================================== */
const registerUser = async (userData) => {
  const { firstName, lastName, email, password } = userData;

  const existingUser = await User.findOne({
    email: email.toLowerCase(),
  });

  if (existingUser) {
    throw new Error("Email already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const verificationToken = generateVerificationToken();

  const user = await User.create({
    firstName,
    lastName,
    email: email.toLowerCase(),
    password: hashedPassword,
    verificationToken,
    isVerified: false,
  });

  return {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    verificationToken,
  };
};

/* ===========================================
   LOGIN
=========================================== */
const loginUser = async (email, password) => {
  const user = await User.findOne({
    email: email.toLowerCase(),
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (!user.isVerified) {
    throw new Error("Please verify your email before logging in.");
  }

  if (user.lockUntil && user.lockUntil > Date.now()) {
    throw new Error(
      "Your account has been locked due to multiple failed login attempts."
    );
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    user.failedLoginAttempts++;

    if (user.failedLoginAttempts >= 5) {
      user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      user.failedLoginAttempts = 0;
    }

    await user.save();

    throw new Error("Invalid email or password");
  }

  user.failedLoginAttempts = 0;
  user.lockUntil = null;

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshToken = refreshToken;
  user.lastLogin = new Date();

  await user.save();

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    },
  };
};

/* ===========================================
   VERIFY EMAIL
=========================================== */
const verifyEmail = async (token) => {
  const user = await User.findOne({
    verificationToken: token,
  });

  if (!user) {
    throw new Error("Invalid verification token");
  }

  user.isVerified = true;
  user.verificationToken = null;

  await user.save();

  return true;
};
/* ===========================================
   FORGOT PASSWORD
=========================================== */
const forgotPassword = async (email) => {
  const user = await User.findOne({
    email: email.toLowerCase(),
  });

  if (!user) {
    throw new Error("User not found");
  }

  const resetToken = generateResetToken();

  user.passwordResetToken = resetToken;
  user.passwordResetExpires = new Date(
    Date.now() + 15 * 60 * 1000
  );

  await user.save();

  return {
    resetToken,
  };
};

/* ===========================================
   RESET PASSWORD
=========================================== */
const resetPassword = async (token, newPassword) => {
  const user = await User.findOne({
    passwordResetToken: token,
  });

  if (!user) {
    throw new Error("Invalid reset token");
  }

  if (
    !user.passwordResetExpires ||
    user.passwordResetExpires < Date.now()
  ) {
    throw new Error("Reset token has expired");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  user.password = hashedPassword;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  user.lastPasswordChange = new Date();

  await user.save();

  return true;
};

module.exports = {
  registerUser,
  loginUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
};