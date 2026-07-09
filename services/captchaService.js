// const axios = require("axios");

// const verifyCaptcha = async (token) => {
//   if (!token) {
//     throw new Error("Please complete the reCAPTCHA.");
//   }

//   const response = await axios.post(
//     "https://www.google.com/recaptcha/api/siteverify",
//     null,
//     {
//       params: {
//         secret: process.env.RECAPTCHA_SECRET_KEY,
//         response: token,
//       },
//     }
//   );

//   console.log("Google reCAPTCHA response:", response.data);

//   if (!response.data.success) {
//     throw new Error("Invalid reCAPTCHA.");
//   }

//   return true;
// };

// module.exports = { verifyCaptcha };

const axios = require("axios");

const verifyCaptcha = async (token) => {
  // Skip CAPTCHA only in development for backend testing
  if (process.env.NODE_ENV === "development") {
    console.log("⚠ Development mode - reCAPTCHA skipped");
    return true;
  }

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

  console.log("Google reCAPTCHA response:", response.data);

  if (!response.data.success) {
    throw new Error("Invalid reCAPTCHA.");
  }

  return true;
};

module.exports = { verifyCaptcha };