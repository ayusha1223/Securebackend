const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    action: {
      type: String,
      required: true,
    },

    resource: {
      type: String,
      default: "",
    },

    resourceId: {
      type: String,
      default: "",
    },

    ipAddress: {
      type: String,
      default: "",
    },

    userAgent: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["SUCCESS", "FAILED"],
      default: "SUCCESS",
    },

    details: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);