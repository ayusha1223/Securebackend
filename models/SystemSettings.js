const mongoose = require("mongoose");

const systemSettingsSchema = new mongoose.Schema(
  {
    autoLogout: {
      type: Number,
      default: 15,
      min: 1,
    },

    loginAttempts: {
      type: Number,
      default: 5,
      min: 1,
    },

    lockDuration: {
      type: Number,
      default: 15,
      min: 1,
    },

    passwordExpiry: {
      type: Number,
      default: 90,
      min: 1,
    },

    requireEmailVerification: {
      type: Boolean,
      default: true,
    },

    enableMFA: {
      type: Boolean,
      default: false,
    },

    requireUppercase: {
      type: Boolean,
      default: true,
    },

    requireLowercase: {
      type: Boolean,
      default: true,
    },

    requireNumbers: {
      type: Boolean,
      default: true,
    },

    requireSymbols: {
      type: Boolean,
      default: true,
    },

    notifyRegistration: {
      type: Boolean,
      default: true,
    },

    notifyPasswordReset: {
      type: Boolean,
      default: true,
    },

    notifyAccountLocked: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "SystemSettings",
  systemSettingsSchema
);