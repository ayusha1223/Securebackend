const express = require("express");
const dotenv = require("dotenv");

// Load environment variables FIRST
dotenv.config();
dotenv.config();
console.log("SERVER JWT_SECRET:", process.env.JWT_SECRET);

const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const vaultRoutes = require("./routes/vaultRoutes");
const utilityRoutes = require("./routes/utilityRoutes");
const auditRoutes = require("./routes/auditRoutes");
const adminRoutes = require("./routes/adminRoutes");

connectDB();

const app = express();

// Trust exactly one proxy hop (the Docker/Nginx layer in front of us).
// Setting this to `true` would let an attacker spoof X-Forwarded-For and
// bypass every rate limiter by rotating the header value per request.
app.set("trust proxy", 1);

// Apply HTTP security headers
app.use(helmet());

// Allow localhost and any private LAN address on the dev port.
// External origins remain blocked - reflecting arbitrary origins with
// credentials enabled would be a vulnerability.
const allowedOrigins = [
  /^http:\/\/localhost:(5173|5174)$/,
  /^http:\/\/127\.0\.0\.1:(5173|5174)$/,
  /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:(5173|5174)$/,
  /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:(5173|5174)$/,
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser clients (Postman, curl, Burp) with no Origin header
      if (!origin) return callback(null, true);

      const isAllowed = allowedOrigins.some((pattern) =>
        pattern.test(origin)
      );

      return isAllowed
        ? callback(null, true)
        : callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// Limit request body size - unbounded JSON parsing is a trivial DoS vector
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

app.use(cookieParser());

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🚀 SecureVault Backend Running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/vault", vaultRoutes);
app.use("/api/utility", utilityRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});