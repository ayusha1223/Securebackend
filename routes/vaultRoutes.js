const express = require("express");

const router = express.Router();
const validateVault = require("../middleware/vaultValidation");
const protect = require("../middleware/auth");

const {
  addPassword,
  getPasswords,
  getPassword,
  editPassword,
  removePassword,
  searchPasswords,
  getCategoryPasswords,
  getFavourites,
  favouritePassword,
  getPasswordHealth,
} = require("../controllers/VaultController");

/* ===========================================
   Vault CRUD
=========================================== */

// Create Password
router.post(
  "/",
  protect,
  validateVault,
  addPassword
);

// Get All Passwords
router.get("/", protect, getPasswords);

// Search Passwords
router.get("/search", protect, searchPasswords);

// Favourite Passwords
router.get("/favourites", protect, getFavourites);

// Passwords by Category
router.get(
  "/category/:category",
  protect,
  getCategoryPasswords
);

// Password Health Dashboard
router.get(
  "/health",
  protect,
  getPasswordHealth
);

// Get Single Password
router.get("/:id", protect, getPassword);

// Update Password
router.put("/:id", protect, editPassword);

// Delete Password
router.delete("/:id", protect, removePassword);

// Toggle Favourite
router.patch(
  "/:id/favourite",
  protect,
  favouritePassword
);

module.exports = router;