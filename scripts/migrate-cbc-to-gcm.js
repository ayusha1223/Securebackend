/**
 * One-time migration: AES-256-CBC  ->  AES-256-GCM
 *
 * Re-encrypts every vault entry still stored in the legacy two-part
 * format (iv:ciphertext) into the authenticated three-part GCM format
 * (iv:authTag:ciphertext), and backfills the HMAC-SHA256 reuse
 * fingerprint at the same time.
 *
 * Safe to run repeatedly: entries already in GCM format are skipped.
 *
 * Usage (dry run first - makes no changes, just reports):
 *   node scripts/migrate-cbc-to-gcm.js --dry-run
 *
 * Then for real:
 *   node scripts/migrate-cbc-to-gcm.js
 *
 * If you rotated ENCRYPTION_KEY during the GCM upgrade, put the previous
 * key in .env as OLD_ENCRYPTION_KEY before running.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const {
  encrypt,
  decryptLegacyCBC,
  fingerprint,
} = require("../utils/encrypt");

const DRY_RUN = process.argv.includes("--dry-run");

// Encrypted fields on the vault collection. Your sample document shows only
// `password` is encrypted; add more field names here if you encrypted others.
const ENCRYPTED_FIELDS = ["password"];

const isLegacyFormat = (value) =>
  typeof value === "string" && value.split(":").length === 2;

const isGcmFormat = (value) =>
  typeof value === "string" && value.split(":").length === 3;

const run = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI is not set.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log(`Connected. ${DRY_RUN ? "[DRY RUN - no writes]" : "[LIVE]"}`);

  const collection = mongoose.connection.db.collection("vaults");
  const cursor = collection.find({});

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for await (const doc of cursor) {
    const updates = {};
    let docFailed = false;

    for (const field of ENCRYPTED_FIELDS) {
      const value = doc[field];

      if (value == null) continue;

      if (isGcmFormat(value)) {
        // Already migrated
        continue;
      }

      if (!isLegacyFormat(value)) {
        console.error(
          `  [${doc._id}] ${field}: unrecognised format, skipping document.`
        );
        docFailed = true;
        break;
      }

      try {
        const plaintext = decryptLegacyCBC(value);
        updates[field] = encrypt(plaintext);

        // Backfill the reuse-detection fingerprint for the password field
        if (field === "password") {
          updates.passwordFingerprint = fingerprint(plaintext);
        }
      } catch (err) {
        console.error(
          `  [${doc._id}] ${field}: legacy decrypt failed - ${err.message}`
        );
        docFailed = true;
        break;
      }
    }

    if (docFailed) {
      failed++;
      continue;
    }

    if (Object.keys(updates).length === 0) {
      skipped++;
      continue;
    }

    if (!DRY_RUN) {
      await collection.updateOne({ _id: doc._id }, { $set: updates });
    }
    migrated++;
    console.log(`  [${doc._id}] migrated (${Object.keys(updates).join(", ")})`);
  }

  console.log("\n--- Migration summary ---");
  console.log(`Migrated: ${migrated}`);
  console.log(`Already GCM / skipped: ${skipped}`);
  console.log(`Failed: ${failed}`);

  if (DRY_RUN) {
    console.log("\nDry run only - nothing was written. Re-run without --dry-run to apply.");
  }

  if (failed > 0) {
    console.log(
      "\nFailures usually mean the key changed. If you regenerated ENCRYPTION_KEY " +
        "during the GCM upgrade, set OLD_ENCRYPTION_KEY in .env to the previous key and re-run."
    );
  }

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("Migration crashed:", err);
  process.exit(1);
});