const express = require("express");

const router = express.Router();

const protect = require("../middleware/auth");
const admin = require("../middleware/admin");

const {
  dashboardStats,
  getUsers,
  lockUser,
  unlockUser,
  deleteUser,
  auditLogs,
  adminDashboard,
  getSystemSettings,
  updateSystemSettings,
} = require("../controllers/AdminController");

router.get(
  "/statistics",
  protect,
  admin,
  dashboardStats
);

/* ===========================================
   Users
=========================================== */

router.get(
  "/users",
  protect,
  admin,
  getUsers
);

router.put(
  "/users/:id/lock",
  protect,
  admin,
  lockUser
);
router.get(
  "/settings",
  protect,
  admin,
  getSystemSettings
);

router.put(
  "/settings",
  protect,
  admin,
  updateSystemSettings
);

router.put(
  "/users/:id/unlock",
  protect,
  admin,
  unlockUser
);

router.delete(
  "/users/:id",
  protect,
  admin,
  deleteUser
);
router.get(
  "/dashboard",
  protect,
  admin,
  adminDashboard
);

/* ===========================================
   Audit Logs
=========================================== */

router.get(
  "/audit-logs",
  protect,
  admin,
  auditLogs
);

module.exports = router;