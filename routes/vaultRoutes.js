const express = require("express");

const router = express.Router();

const protect = require("../middleware/auth");

const {
  addPassword,
  getPasswords,
  getPassword,
  editPassword,
  removePassword,
} = require("../controllers/VaultController");

/* ============================
   Vault Routes
============================ */

// Create Password
router.post("/", protect, addPassword);

// Get All Passwords
router.get("/", protect, getPasswords);

// Get Single Password
router.get("/:id", protect, getPassword);

// Update Password
router.put("/:id", protect, editPassword);

// Delete Password
router.delete("/:id", protect, removePassword);

module.exports = router;