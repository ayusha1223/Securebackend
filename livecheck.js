require("dotenv").config();
const http = require("http");
const jwt = require("jsonwebtoken");

console.log("Script's JWT_SECRET:", process.env.JWT_SECRET.slice(0, 12), "...");

const b = JSON.stringify({ email: "alice@test.com", password: "Password@123" });
const r = http.request(
  { host: "localhost", port: 5000, path: "/api/auth/login", method: "POST",
    headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(b) } },
  (s) => {
    let d = ""; s.on("data", c => d += c);
    s.on("end", () => {
      const parsed = JSON.parse(d);
      const token = parsed.accessToken;
      if (!token) { console.log("No token. requiresMFA?", parsed.requiresMFA, "| full:", d); return; }
      console.log("Token payload:", jwt.decode(token));
      try {
        jwt.verify(token, process.env.JWT_SECRET);
        console.log(">>> MATCH");
      } catch (e) {
        console.log(">>> MISMATCH:", e.message);
      }
    });
  }
);
r.write(b); r.end();