const express = require("express");

const router = express.Router();

const protect = require("../middleware/auth");

const {
  myLogs,
  allLogs,
} = require("../controllers/AuditController");

router.get("/me", protect, myLogs);

router.get("/all", protect, allLogs);

module.exports = router;