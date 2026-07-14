require("dotenv").config();
const jwt = require("jsonwebtoken");

const secret = process.env.JWT_SECRET;
console.log("SECRET:", JSON.stringify(secret), "LEN:", secret.length);

const token = jwt.sign({ id: "123", role: "admin" }, secret, { expiresIn: "1h" });
console.log("TOKEN:", token);

try {
  const decoded = jwt.verify(token, secret);
  console.log("SELF-VERIFY OK:", JSON.stringify(decoded));
} catch (e) {
  console.log("SELF-VERIFY FAILED:", e.message);
}