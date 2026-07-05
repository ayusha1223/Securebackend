const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // Personal Information
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    avatar: {
      type: String,
      default: "",
    },

    // Role Based Access Control
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // Email Verification
    isVerified: {
      type: Boolean,
      default: false,
    },

    verificationToken: {
      type: String,
      default: null,
    },

    // Password Reset
    passwordResetToken: {
      type: String,
      default: null,
    },

    passwordResetExpires: {
      type: Date,
      default: null,
    },

    // Account Lock
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },

    lockUntil: {
      type: Date,
      default: null,
    },

    // MFA
    mfaEnabled: {
      type: Boolean,
      default: false,
    },

    mfaCode: {
      type: String,
      default: null,
    },

    mfaExpires: {
      type: Date,
      default: null,
    },

    // Refresh Token
    refreshToken: {
      type: String,
      default: null,
    },

    // Audit
    lastLogin: {
      type: Date,
      default: null,
    },

    lastPasswordChange: {
      type: Date,
      default: Date.now,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);