const mongoose = require("mongoose");

const vaultSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    websiteName: {
      type: String,
      required: true,
      trim: true,
    },

    websiteUrl: {
      type: String,
      trim: true,
      default: "",
    },

    username: {
      type: String,
      trim: true,
      default: "",
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    password: {
      type: String,
      required: true,
    },

    // Keyed HMAC of the plaintext password.
    // Enables reuse detection without decrypting the vault.
    passwordFingerprint: {
      type: String,
      required: true,
      index: true,
    },

    passwordExpiry: {
      type: Date,
      default: () => {
        const date = new Date();
        date.setDate(date.getDate() + 90);
        return date;
      },
    },

    category: {
      type: String,
      default: "General",
    },

    notes: {
      type: String,
      default: "",
    },

    favourite: {
      type: Boolean,
      default: false,
    },

    tags: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Vault", vaultSchema);