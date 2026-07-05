const analyzePassword = (password) => {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;

  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  let strength = "Weak";

  if (score >= 6) strength = "Very Strong";
  else if (score >= 5) strength = "Strong";
  else if (score >= 3) strength = "Medium";

  return {
    score,
    strength,
  };
};

module.exports = {
  analyzePassword,
};