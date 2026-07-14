const User = require("../models/User");
const { getAllLogs } = require("../services/auditService");
const Vault = require("../models/Vault");
const AuditLog = require("../models/AuditLog");
const SystemSettings = require("../models/SystemSettings");

/* ===========================================
   Get All Users
=========================================== */
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===========================================
   Lock User
=========================================== */
const lockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isActive = false;

    // Terminate the session on lock. Without clearing the stored refresh
    // token, a locked user could still mint a fresh access token via
    // POST /api/auth/refresh-token and regain access (CWE-613).
    user.refreshToken = null;

    await user.save();

    res.status(200).json({
      success: true,
      message: "User account locked.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===========================================
   Unlock User
=========================================== */
const unlockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isActive = true;
    user.failedLoginAttempts = 0;
    user.lockUntil = null;

    await user.save();

    res.status(200).json({
      success: true,
      message: "User account unlocked.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===========================================
   Delete User
=========================================== */
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: "User deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
/* ===========================================
   Admin Dashboard
=========================================== */
const adminDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    const totalVaults = await Vault.countDocuments();

    const totalAuditLogs =
      await AuditLog.countDocuments();

    const adminUsers =
      await User.countDocuments({
        role: "admin",
      });

    const recentUsers = await User.find()
      .select(
        "firstName lastName email role createdAt"
      )
      .sort({
        createdAt: -1,
      })
      .limit(5);

    const recentLogs = await AuditLog.find()
      .populate(
        "user",
        "firstName lastName"
      )
      .sort({
        createdAt: -1,
      })
      .limit(5);

    res.status(200).json({
      success: true,

      data: {
        stats: {
          totalUsers,
          totalVaults,
          totalAuditLogs,
          adminUsers,
        },

        recentUsers,

        recentLogs,
      },
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===========================================
   Audit Logs
=========================================== */
const auditLogs = async (req, res) => {
  try {
    const logs = await getAllLogs();

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
/* ===========================================
   Dashboard Statistics
=========================================== */
const dashboardStats = async (req, res) => {
  try {
    const User = require("../models/User");
    const Vault = require("../models/Vault");
    const AuditLog = require("../models/AuditLog");

    const totalUsers = await User.countDocuments();

    const totalVaults = await Vault.countDocuments();

    const totalLogs = await AuditLog.countDocuments();

    const admins = await User.countDocuments({
      role: "admin",
    });

    const normalUsers = await User.countDocuments({
      role: "user",
    });

    const activeUsers = await User.countDocuments({
      isActive: true,
    });

    const lockedUsers = await User.countDocuments({
      isActive: false,
    });

    const verifiedUsers = await User.countDocuments({
      isVerified: true,
    });

    const unverifiedUsers = await User.countDocuments({
      isVerified: false,
    });

    const categories = await Vault.aggregate([
      {
        $group: {
          _id: "$category",
          value: {
            $sum: 1,
          },
        },
      },
    ]);

    res.json({
      success: true,

      data: {
        totalUsers,
        totalVaults,
        totalLogs,

        admins,
        normalUsers,

        activeUsers,
        lockedUsers,

        verifiedUsers,
        unverifiedUsers,

        categories,
      },
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
/* ===========================================
   Get System Settings
=========================================== */
const getSystemSettings = async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();

    if (!settings) {
      settings = await SystemSettings.create({});
    }

    res.status(200).json({
      success: true,
      data: settings,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===========================================
   Update System Settings
=========================================== */
const updateSystemSettings = async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();

    if (!settings) {
      settings = await SystemSettings.create(req.body);
    } else {
      Object.assign(settings, req.body);
      await settings.save();
    }

    res.status(200).json({
      success: true,
      message: "System settings updated.",
      data: settings,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
module.exports = {
  getUsers,
  lockUser,
  unlockUser,
  deleteUser,
  auditLogs,
  dashboardStats,
  adminDashboard,
  getSystemSettings,
  updateSystemSettings,
};