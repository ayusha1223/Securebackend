const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;
  // Read JWT from the Authorization header
  if (req.headers.authorization &&req.headers.authorization.startsWith("Bearer")
  ) {token = req.headers.authorization.split(" ")[1];}
// Otherwise, read JWT from the HttpOnly cookie
  if (!token && req.cookies?.accessToken) {token = req.cookies.accessToken;}
   // Reject requests without a valid JWT
  if (!token) {return res.status(401).json({success: false,message: "Access denied. No token provided.",
    });
  }
try {
   // Verify the JWT signature and expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
     // Load the authenticated user (excluding the password)
req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Reject deactivated accounts on every request, not just at login.
    // A stateless JWT stays valid until it expires, so without this check
    // an account locked by an admin would keep working until the token
    // ran out - and could even mint new tokens via /refresh-token (CWE-613).
    if (!req.user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated.",
      });
    }

    next();

 } catch (error) {
    console.log("JWT VERIFY ERROR:", error.name, "-", error.message);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = protect;