const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;   // 96-bit IV is the NIST-recommended size for GCM
const TAG_LENGTH = 16;  // 128-bit authentication tag

// Legacy algorithm - retained ONLY so the one-time migration script can
// decrypt data written before the GCM upgrade. Nothing in the application
// should call decryptLegacyCBC directly.
const LEGACY_ALGORITHM = "aes-256-cbc";
const LEGACY_IV_LENGTH = 16;

/**
 * Load and validate the encryption key at boot.
 * The key must be 32 bytes (256 bits) supplied as a 64-character hex string.
 * Failing fast here prevents the application from ever running with a
 * weak, truncated, or absent key.
 */
const loadKey = (envVar, { optional = false } = {}) => {
  const raw = process.env[envVar];

  if (!raw) {
    if (optional) return null;
    throw new Error(`${envVar} is not set.`);
  }

  const key = Buffer.from(raw, "hex");

  if (key.length !== 32) {
    throw new Error(
      `${envVar} must be a 64-character hex string (32 bytes). ` +
      `Got ${key.length} bytes.`
    );
  }

  return key;
};

const ENCRYPTION_KEY = loadKey("ENCRYPTION_KEY");
const FINGERPRINT_KEY = loadKey("FINGERPRINT_KEY");

// Only needed if the key was rotated at the same time as the CBC -> GCM
// upgrade. If OLD_ENCRYPTION_KEY is not set, legacy decryption falls back
// to the current ENCRYPTION_KEY.
// The pre-upgrade code did Buffer.from(process.env.ENCRYPTION_KEY) with no
// encoding, i.e. it used the key string's raw UTF-8 bytes. The old key was
// therefore a 32-character string, not hex. Load it the same way here so
// legacy ciphertext decrypts correctly.
const loadLegacyKey = () => {
  const raw = process.env.OLD_ENCRYPTION_KEY;
  if (!raw) return ENCRYPTION_KEY; // fall back if key never changed

  const key = Buffer.from(raw); // utf8, matching the old implementation
  if (key.length !== 32) {
    throw new Error(
      `OLD_ENCRYPTION_KEY must be exactly 32 characters (old CBC key format). ` +
      `Got ${key.length} bytes.`
    );
  }
  return key;
};

const OLD_ENCRYPTION_KEY = loadLegacyKey();

/**
 * Encrypt with AES-256-GCM.
 *
 * GCM is an authenticated cipher: it produces an authentication tag that
 * is verified on decryption. AES-256-CBC (previously used here) provides
 * confidentiality but no integrity, making stored ciphertext malleable -
 * an attacker with write access to the database could flip bits in the IV
 * to predictably alter the decrypted plaintext without detection (CWE-353).
 *
 * Format: iv:authTag:ciphertext  (all hex)
 *
 * NOTE: never log the plaintext or the derived ciphertext here. Vault
 * secrets passing through this function must not reach stdout/log files
 * (sensitive data exposure in logs).
 */
const encrypt = (text) => {
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv, {
    authTagLength: TAG_LENGTH,
  });

  let encrypted = cipher.update(String(text), "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return [iv.toString("hex"), authTag.toString("hex"), encrypted].join(":");
};

/**
 * Decrypt and verify. Throws if the ciphertext has been tampered with.
 */
const decrypt = (payload) => {
  const parts = String(payload).split(":");

  if (parts.length !== 3) {
    throw new Error("Malformed ciphertext.");
  }

  const [ivHex, tagHex, encrypted] = parts;

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    ENCRYPTION_KEY,
    Buffer.from(ivHex, "hex"),
    { authTagLength: TAG_LENGTH }
  );

  // Throws on mismatch - this is the integrity guarantee CBC lacked
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};

/**
 * Decrypt data written by the pre-upgrade AES-256-CBC implementation.
 * Format: iv:ciphertext (two hex parts, 16-byte IV).
 *
 * Exported ONLY for the one-time migration script
 * (scripts/migrate-cbc-to-gcm.js). Do not use in application code.
 */
const decryptLegacyCBC = (payload) => {
  const parts = String(payload).split(":");

  if (parts.length !== 2) {
    throw new Error("Not a legacy CBC payload.");
  }

  const [ivHex, encrypted] = parts;
  const iv = Buffer.from(ivHex, "hex");

  if (iv.length !== LEGACY_IV_LENGTH) {
    throw new Error("Invalid legacy IV length.");
  }

  const decipher = crypto.createDecipheriv(
    LEGACY_ALGORITHM,
    OLD_ENCRYPTION_KEY,
    iv
  );

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};

/**
 * Deterministic keyed fingerprint of a secret.
 *
 * Used for password-reuse detection. Previously, detecting reuse required
 * decrypting every vault entry the user owned and comparing plaintexts in
 * memory - an O(n) decryption on every write, and a large plaintext exposure
 * surface. An HMAC fingerprint lets the same check run as a single indexed
 * database query with no decryption at all.
 *
 * Keyed (HMAC) rather than a bare hash so that an attacker who steals only
 * the database cannot brute-force the fingerprints offline without also
 * obtaining FINGERPRINT_KEY.
 */
const fingerprint = (text) =>
  crypto
    .createHmac("sha256", FINGERPRINT_KEY)
    .update(String(text))
    .digest("hex");

module.exports = {
  encrypt,
  decrypt,
  decryptLegacyCBC,
  fingerprint,
};

