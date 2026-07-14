const express = require("express");

const router = express.Router();

const protect = require("../middleware/auth");
const admin = require("../middleware/admin");

const {
  myLogs,
  allLogs,
} = require("../controllers/AuditController");

// A user's own logs - any authenticated user
router.get("/me", protect, myLogs);

// All users' logs - admin only (fixes Broken Access Control / CWE-862)
router.get("/all", protect, admin, allLogs);

module.exports = router;