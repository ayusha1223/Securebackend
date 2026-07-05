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