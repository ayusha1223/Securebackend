// test-real-crypto.js
// Integrity PoC against the REAL vault crypto util (utils/crypto.js).
// Demonstrates that AES-256-GCM decrypt() rejects any tampered ciphertext.
//
// Run from the backendsecure folder so the require path resolves:
//   node test-real-crypto.js
//
// This uses your actual encrypt() and decrypt() - no reimplementation.

// Load your real keys from .env if you have dotenv installed:
try { require("dotenv").config(); } catch (_) {}

// crypto.js throws at import if ENCRYPTION_KEY / FINGERPRINT_KEY are absent.
// The integrity property does not depend on the specific key value (encrypt
// and decrypt use the same key within this run), so if the env vars are not
// already set we supply valid 32-byte hex keys purely so the module loads.
const crypto = require("crypto");
if (!process.env.ENCRYPTION_KEY)  process.env.ENCRYPTION_KEY  = crypto.randomBytes(32).toString("hex");
if (!process.env.FINGERPRINT_KEY) process.env.FINGERPRINT_KEY = crypto.randomBytes(32).toString("hex");

// >>> adjust this path if your util lives elsewhere <<<
const { encrypt, decrypt } = require("./utils/encrypt");

const PLAINTEXT = "MyP@ssw0rd123!";

// Flip one bit of the IV (first hex byte) - simulates an attacker with
// database write access modifying the stored ciphertext.
function tamper(stored) {
  const parts = stored.split(":");
  const iv = Buffer.from(parts[0], "hex");
  iv[0] ^= 0x01;
  parts[0] = iv.toString("hex");
  return parts.join(":");
}

console.log("=================================================");
console.log(" Integrity test - real vault crypto (AES-256-GCM)");
console.log("=================================================");

const stored = encrypt(PLAINTEXT);
console.log("Original plaintext  :", PLAINTEXT);
console.log("Stored ciphertext   :", stored, "(iv:authTag:ciphertext)");
console.log("Decrypt (untampered):", decrypt(stored));

const tampered = tamper(stored);
console.log("Tampered ciphertext :", tampered);

try {
  const out = decrypt(tampered);
  console.log("Decrypt (tampered)  :", out);
  console.log(">> FAIL: tampered ciphertext decrypted without error");
} catch (e) {
  console.log("TAMPER: rejected  (" + e.message + ")");
  console.log(">> GCM auth tag detected the modification - integrity enforced");
}
// A sanitize() helper was added to 
// getPasswordHealth in VaultController.js
// to strip password and passwordFingerprint
// from every object before it is returned,
// matching the behaviour of the other vault endpoints:
const sanitize = (vault) => {
  const obj = vault.toObject();
  delete obj.password;               // remove ciphertext
  delete obj.passwordFingerprint;    // remove reuse fingerprint
  return obj;
};


//Return a single, identical generic response
//for all failed logins regardless of whether
//the account exists, is unverified, or has a
//wrong password — for example: "Invalid email or password."
//Verification status should be communicated only after 
//successful password authentication (or handled silently 
//via the email channel), never in the pre-authentication 
//response. Ensure response timing is consistent so accounts 
// cannot be distinguished by latency.
const user = await User.findOne({ email });
// Generic response for all failed logins - do not reveal whether the
// account exists or its verification state (CWE-204).
if (!user || !user.isVerified) {
  return res.status(401).json({
    success: false,
    message: "Invalid email or password",
  });
}




