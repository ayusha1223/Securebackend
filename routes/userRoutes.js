const express = require("express");

const router = express.Router();

const protect = require("../middleware/auth");

const {
  getProfile,
  updateProfile,
  changePassword,
} = require("../controllers/UserController");

/* ===========================
   Profile
=========================== */

router.get("/profile", protect, getProfile);

router.put("/profile", protect, updateProfile);

router.put(
  "/change-password",
  protect,
  changePassword
);

module.exports = router;