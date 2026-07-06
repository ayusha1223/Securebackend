const analyzePassword = (password = "") => {
  const checks = {
    length: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
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