const express = require("express");
const { body } = require("express-validator");

const router = express.Router();

const { register } = require("../controllers/AuthController");
const validate = require("../middleware/validate");

router.post(
  "/register",

  [
    body("firstName")
      .notEmpty()
      .withMessage("First name is required"),

    body("lastName")
      .notEmpty()
      .withMessage("Last name is required"),

    body("email")
      .isEmail()
      .withMessage("Invalid email"),

    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
  ],

  validate,

  register
);

module.exports = router;