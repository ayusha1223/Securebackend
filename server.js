const express = require("express");

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

app.get("/", (req, res) => {
    res.send("🚀 SecureVault Backend is Running");
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});