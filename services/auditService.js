const AuditLog = require("../models/AuditLog");

const createAuditLog = async ({
  user,
  action,
  resource = "",
  resourceId = "",
  req = null,
  status = "SUCCESS",
  details = "",
}) => {
  try {
    await AuditLog.create({
      user,
      action,
      resource,
      resourceId,
      ipAddress: req?.ip || "",
      userAgent: req?.headers["user-agent"] || "",
      status,
      details,
    });
  } catch (error) {
    console.error("Audit Log Error:", error.message);
  }
};

const getUserLogs = async (userId) => {
  return await AuditLog.find({ user: userId }).sort({
    createdAt: -1,
  });
};

const getAllLogs = async () => {
  return await AuditLog.find()
    .populate("user", "firstName lastName email")
    .sort({
      createdAt: -1,
    });
};

module.exports = {
  createAuditLog,
  getUserLogs,
  getAllLogs,
};