const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    // User performing the action
user: {type: mongoose.Schema.Types.ObjectId,ref: "User",required: true,},
// Login, update, delete etc.
action: {type: String,required: true,},
resource: {type: String,default: "",},
resourceId: {type: String,default: "",},
// IP address of request
ipAddress: {type: String,default: "",},
// Browser information
userAgent: {type: String,default: "",},
// SUCCESS or FAILED
status: {type: String,enum: ["SUCCESS", "FAILED"],default: "SUCCESS",},
details: {type: String,default: "",},
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);