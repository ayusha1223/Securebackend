const express = require("express");
const { body } = require("express-validator");

const router = express.Router();

const validate = require("../middleware/validate");

const {
  register,
} = require("../controllers/AuthController");

// Register
router.post(
  "/register",
  [
    body("firstName")
      .trim()
      .notEmpty()
      .withMessage("First name is required"),

    body("lastName")
      .trim()
      .notEmpty()
      .withMessage("Last name is required"),

    body("email")
      .isEmail()
      .withMessage("Valid email is required"),

    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
  ],
  validate,
  register
);

module.exports = router;