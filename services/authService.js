const bcrypt = require("bcrypt");
const User = require("../models/User");

const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/generateToken");

const generateVerificationToken = require("../utils/generateVerificationToken");
const generateResetToken = require("../utils/generateResetToken");
const { sendEmail } = require("./emailService");

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

  const verifyLink = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

  await sendEmail({
    to: user.email,
    subject: "Verify your SecureVault Account",
    html: `
      <h2>Welcome to SecureVault</h2>
      <p>Please verify your email.</p>

      <a href="${verifyLink}"
         style="
           background:#2563eb;
           color:white;
           padding:12px 20px;
           border-radius:6px;
           text-decoration:none;">
         Verify Email
      </a>
    `,
  });

  return {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  };
};

/* ===========================================
   LOGIN
=========================================== */
const loginUser = async (email, password) => {
  const user = await User.findOne({
    email: email.toLowerCase(),
  });
  console.log("LOGIN USER:");
console.log({
  email: user?.email,
  failedLoginAttempts: user?.failedLoginAttempts,
  lockUntil: user?.lockUntil,
  isVerified: user?.isVerified,
});

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (!user.isVerified) {
    throw new Error("Please verify your email first.");
  }

  if (user.lockUntil && user.lockUntil > Date.now()) {
    throw new Error(
      "Account temporarily locked due to multiple failed login attempts."
    );
  }

  const isMatch = await bcrypt.compare(
    password,
    user.password
  );
  console.log("Password Match:", isMatch);

  if (!isMatch) {
    user.failedLoginAttempts++;

    if (user.failedLoginAttempts >= 5) {
      user.failedLoginAttempts = 0;
      user.lockUntil = new Date(
        Date.now() + 15 * 60 * 1000
      );
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

  const resetLink =
    `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  await sendEmail({
    to: user.email,
    subject: "SecureVault Password Reset",
    html: `
      <h2>Password Reset</h2>

      <p>Click below to reset your password.</p>

      <a href="${resetLink}"
         style="
           background:#dc2626;
           color:white;
           padding:12px 20px;
           border-radius:6px;
           text-decoration:none;">
         Reset Password
      </a>
    `,
  });

  return true;
};

/* ===========================================
   RESET PASSWORD
=========================================== */
const resetPassword = async (token, password) => {
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
    throw new Error("Reset token expired");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  user.password = hashedPassword;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  user.lastPasswordChange = new Date();

  await user.save();

  return true;
};
/* ===========================================
   ENABLE MFA
=========================================== */
const enableMFA = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  user.mfaEnabled = true;

  await user.save();

  return true;
};

/* ===========================================
   SEND MFA OTP
=========================================== */
const sendMFA = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  const otp = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  user.mfaCode = otp;
  user.mfaExpires = new Date(Date.now() + 5 * 60 * 1000);

  await user.save();

  await sendEmail({
    to: user.email,
    subject: "SecureVault Login OTP",
    html: `
      <h2>SecureVault OTP</h2>

      <p>Your verification code is:</p>

      <h1 style="letter-spacing:6px;">
        ${otp}
      </h1>

      <p>This code expires in 5 minutes.</p>
    `,
  });

  return true;
};

/* ===========================================
   VERIFY MFA OTP
=========================================== */
const verifyMFA = async (userId, otp) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.mfaEnabled) {
    throw new Error("MFA is not enabled.");
  }

  if (
    !user.mfaCode ||
    !user.mfaExpires ||
    user.mfaExpires < Date.now()
  ) {
    throw new Error("OTP expired");
  }

  if (user.mfaCode !== otp) {
    throw new Error("Invalid OTP");
  }

  user.mfaCode = null;
  user.mfaExpires = null;

  await user.save();

  return true;
};

module.exports = {
  registerUser,
  loginUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
  enableMFA,
  sendMFA,
  verifyMFA,
};