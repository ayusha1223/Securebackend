const { body } = require("express-validator");

// Reusable strong-password policy: length + complexity.
const passwordPolicy = (field = "password") => [
  body(field)
    .isString().withMessage("Password is required")
    .isLength({ min: 12 }).withMessage("Password must be at least 12 characters long")
    .matches(/[A-Z]/).withMessage("Password must contain an uppercase letter")
    .matches(/[a-z]/).withMessage("Password must contain a lowercase letter")
    .matches(/[0-9]/).withMessage("Password must contain a number")
    .matches(/[^A-Za-z0-9]/).withMessage("Password must contain a special character"),
];

module.exports = { passwordPolicy };
