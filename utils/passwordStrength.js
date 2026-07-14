const analyzePassword = (password = "") => {
  // Check minimum password requirements
  const checks = {
    // Password must contain at least 12 characters
    length: password.length >= 12,
    // At least one uppercase letter
    uppercase: /[A-Z]/.test(password),
// At least one lowercase letter
    lowercase: /[a-z]/.test(password),
    // At least one digit
    number: /[0-9]/.test(password),
    // At least one special character
    symbol: /[^A-Za-z0-9]/.test(password),
  };
  const score = Object.values(checks).filter(Boolean).length;
  let strength = "Weak";
  if (score === 5) {
    strength = "Strong";
  } else if (score >= 3) {
    strength = "Medium";
  }
  return {
    score,
    strength,
    checks,
  };
};
module.exports = {
  analyzePassword,
};