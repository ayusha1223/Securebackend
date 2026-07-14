const { body, validationResult } = require("express-validator");

const validateVault = [
  body("websiteName")
    .notEmpty()
    .withMessage("Website name is required"),

 body("websiteUrl")
  .optional({ checkFalsy: true })
  .isURL()
    .withMessage("Invalid website URL"),

 body("email")
  .optional({ checkFalsy: true })
  .isEmail()
    .withMessage("Invalid email"),

  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    next();
  },
];

module.exports = validateVault;