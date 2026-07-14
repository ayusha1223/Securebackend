const bcrypt = require("bcrypt");
const crypto = require("crypto");
const User = require("../models/User");
const { verifyCaptcha } = require("./captchaService");
const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

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
  // Hash password before storing in MongoDB
  const hashedPassword = await bcrypt.hash(password, 12);
  // Generate an email verification token
  const verificationToken = generateVerificationToken();

  const user = await User.create({
    firstName,
    lastName,
    email: email.toLowerCase(),
     // Store only the hashed verification token
    password: hashedPassword,
   verificationToken: hashToken(verificationToken),
    isVerified: false,
  });
  const verifyLink = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
// Send the verification email to the user
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
const loginUser = async (
  email,
  password,
  captchaToken
) => {
  // Verify Google reCAPTCHA before authenticating the user
  await verifyCaptcha(captchaToken);
  const user = await User.findOne({
    email: email.toLowerCase(),
  });

 if (!user) {
    await bcrypt.compare(password, "$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidin");
    throw new Error("Invalid email or password");
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
  user.lastLogin = new Date();

  await user.save();

  // Reveal verification status ONLY after credentials are confirmed correct
  if (!user.isVerified) {
    throw new Error("Please verify your email first.");
  }

  // ------------------------------
  // MFA Enabled
  // ------------------------------
 if (user.mfaEnabled) {
    const mfaToken = await sendMFA(user._id);

    return {
      requiresMFA: true,
      mfaToken,
      email: user.email,
    };
  }

  // ------------------------------
  // Normal Login
  // ------------------------------
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshToken = refreshToken;
  await user.save();

  return {
    requiresMFA: false,

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
    verificationToken: hashToken(token),
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

  // Never reveal whether the email exists - a different response for
  // known vs unknown emails lets an attacker enumerate accounts.
  if (!user) {
    return true;
  }
  // Generate a secure password reset token
  const resetToken = generateResetToken();
  // Store only the hashed reset token
 user.passwordResetToken = hashToken(resetToken);
 // Set the password reset token expiry time
  user.passwordResetExpires = new Date(
    Date.now() + 15 * 60 * 1000
  );
  await user.save();
  const resetLink =
    `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
// Send the password reset email
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
    passwordResetToken: hashToken(token),
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
/* ===========================================
   SEND MFA OTP
   Returns a short-lived MFA session token.
=========================================== */
const sendMFA = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  // CSPRNG six-digit OTP
  const otp = crypto.randomInt(100000, 1000000).toString();
if (process.env.NODE_ENV !== "production") {
    console.log("=== DEV OTP:", otp, "===");
  }
  // Store only the hash of the OTP - never the plaintext
  user.mfaCode = hashToken(otp);
  user.mfaExpires = new Date(Date.now() + 5 * 60 * 1000);
  user.mfaAttempts = 0;

  // Issue an unguessable MFA session token bound to this user
  const mfaToken = crypto.randomBytes(32).toString("hex");
  user.mfaToken = hashToken(mfaToken);
  user.mfaTokenExpires = new Date(Date.now() + 5 * 60 * 1000);

  await user.save();

  await sendEmail({
    to: user.email,
    subject: "SecureVault - Your verification code",
    html: `
      <h2>SecureVault OTP</h2>
      <h1>${otp}</h1>
      <p>This code expires in 5 minutes.</p>
    `,
  });

  return mfaToken;
};

/* ===========================================
   RESOLVE MFA SESSION
=========================================== */
const getUserByMfaToken = async (mfaToken) => {
  const user = await User.findOne({
    mfaToken: hashToken(mfaToken),
  });

  if (
    !user ||
    !user.mfaTokenExpires ||
    user.mfaTokenExpires < Date.now()
  ) {
    throw new Error("Invalid or expired MFA session.");
  }

  return user;
};

/* ===========================================
   VERIFY MFA OTP
=========================================== */
/* ===========================================
   VERIFY MFA OTP
=========================================== */
const verifyMFA = async (mfaToken, otp) => {
  const user = await getUserByMfaToken(mfaToken);

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

  // Constant-time comparison of the hashed OTP
  const submitted = Buffer.from(hashToken(String(otp)), "hex");
  const stored = Buffer.from(user.mfaCode, "hex");

  const isMatch =
    submitted.length === stored.length &&
    crypto.timingSafeEqual(submitted, stored);

  if (!isMatch) {
    user.mfaAttempts = (user.mfaAttempts || 0) + 1;

    // Per-user lockout - not bypassable by rotating IP
    if (user.mfaAttempts >= 5) {
      user.mfaCode = null;
      user.mfaExpires = null;
      user.mfaAttempts = 0;
      user.mfaToken = null;
      user.mfaTokenExpires = null;
      await user.save();
      throw new Error("Too many incorrect attempts. Please log in again.");
    }

    await user.save();
    throw new Error("Invalid OTP");
  }

  // Single-use: burn the OTP and the MFA session
  user.mfaCode = null;
  user.mfaExpires = null;
  user.mfaAttempts = 0;
  user.mfaToken = null;
  user.mfaTokenExpires = null;

  await user.save();

  return user;
};

module.exports = {
  registerUser,
  loginUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
  enableMFA,
  sendMFA,
   getUserByMfaToken,
  verifyMFA,
};