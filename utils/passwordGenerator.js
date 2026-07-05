const generatePassword = ({
  length = 16,
  uppercase = true,
  lowercase = true,
  numbers = true,
  symbols = true,
}) => {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const nums = "0123456789";
  const syms = "!@#$%^&*()_+{}[]<>?";

  let chars = "";

  if (uppercase) chars += upper;
  if (lowercase) chars += lower;
  if (numbers) chars += nums;
  if (symbols) chars += syms;

  if (!chars) {
    throw new Error("Select at least one character type.");
  }

  let password = "";

  for (let i = 0; i < length; i++) {
    password += chars.charAt(
      Math.floor(Math.random() * chars.length)
    );
  }

  return password;
};

module.exports = {
  generatePassword,
};