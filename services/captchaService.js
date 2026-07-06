const axios = require("axios");

const verifyCaptcha = async (token) => {
  if (!token) {
    throw new Error("Please complete the reCAPTCHA.");
  }

  const response = await axios.post(
    "https://www.google.com/recaptcha/api/siteverify",
    null,
    {
      params: {
        secret: process.env.RECAPTCHA_SECRET_KEY,
        response: token,
      },
    }
  );

  if (!response.data.success) {
    throw new Error("Invalid reCAPTCHA.");
  }

  return true;
};

module.exports = {
  verifyCaptcha,
};