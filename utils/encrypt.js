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

