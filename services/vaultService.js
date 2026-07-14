const Vault = require("../models/Vault");
const { encrypt, decrypt, fingerprint } = require("../utils/encrypt");

/* ============================
   Create Password
============================ */
const createVault = async (userId, data) => {
  const fp = fingerprint(data.password);

  // Reuse detection via keyed HMAC fingerprint.
  // Previously this decrypted every vault entry the user owned and compared
  // plaintexts in memory - an O(n) decryption on every write with a large
  // plaintext exposure surface. A single indexed query now achieves the same
  // result with no decryption at all.
  const duplicate = await Vault.findOne({
    user: userId,
    passwordFingerprint: fp,
  });

  if (duplicate) {
    throw new Error(
      "This password is already used in another account."
    );
  }

  return await Vault.create({
    user: userId,
    websiteName: data.websiteName,
    websiteUrl: data.websiteUrl,
    username: data.username,
    email: data.email,
    password: encrypt(data.password),
    passwordFingerprint: fp,
    category: data.category || "General",
    notes: data.notes || "",
    favourite: data.favourite || false,
    tags: data.tags || [],
  });
};

/* ============================
   Get All Passwords
============================ */
const getAllVaults = async (userId) => {
  const vaults = await Vault.find({
    user: userId,
  }).sort({
    createdAt: -1,
  });

  return vaults.map((vault) => {
    const obj = vault.toObject();

    try {
 try {
  obj.password = decrypt(vault.password);
} catch (err) {
  console.log("========== BAD VAULT ==========");
  console.log("ID:", vault._id);
  console.log("Website:", vault.websiteName);
  console.log("Password:", vault.password);
  console.log(err);
  throw err;
}
} catch (err) {
  console.log(
    "Bad vault:",
    vault._id,
    vault.websiteName,
    vault.password
  );
  throw err;
}

    // Never expose the reuse fingerprint to the client
    delete obj.passwordFingerprint;

    return obj;
  });
};

/* ============================
   Get Single Password
============================ */
const getVaultById = async (userId, vaultId) => {
  const vault = await Vault.findOne({
    _id: vaultId,
    user: userId,
  });

  if (!vault) {
    throw new Error("Password not found");
  }

  const result = vault.toObject();

  result.password = decrypt(vault.password);

  delete result.passwordFingerprint;

  return result;
};

/* ============================
   Update Password
============================ */
const updateVault = async (userId, vaultId, data) => {
  const vault = await Vault.findOne({
    _id: vaultId,
    user: userId,
  });

  if (!vault) {
    throw new Error("Password not found");
  }

  // Prevent password reuse - fingerprint comparison, no decryption.
  // The previous implementation wrapped decryption in a try/catch that
  // silently swallowed errors, which would have concealed exactly the
  // ciphertext tampering that AES-GCM now detects.
  if (data.password !== undefined) {
    const fp = fingerprint(data.password);

    const duplicate = await Vault.findOne({
      user: userId,
      _id: { $ne: vaultId },
      passwordFingerprint: fp,
    });

    if (duplicate) {
      throw new Error(
        "This password is already used in another account."
      );
    }

    vault.password = encrypt(data.password);
    vault.passwordFingerprint = fp;

    // Reset the 90-day expiry only when the password actually changes
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 90);
    vault.passwordExpiry = expiry;
  }

  if (data.websiteName !== undefined)
    vault.websiteName = data.websiteName;

  if (data.websiteUrl !== undefined)
    vault.websiteUrl = data.websiteUrl;

  if (data.username !== undefined)
    vault.username = data.username;

  if (data.email !== undefined)
    vault.email = data.email;

  if (data.category !== undefined)
    vault.category = data.category;

  if (data.notes !== undefined)
    vault.notes = data.notes;

  if (data.favourite !== undefined)
    vault.favourite = data.favourite;

  if (data.tags !== undefined)
    vault.tags = data.tags;

  await vault.save();

  const result = vault.toObject();
  delete result.passwordFingerprint;

  return result;
};

/* ============================
   Delete Password
============================ */
const deleteVault = async (userId, vaultId) => {
  const vault = await Vault.findOne({
    _id: vaultId,
    user: userId,
  });

  if (!vault) {
    throw new Error("Password not found");
  }

  await vault.deleteOne();

  return true;
};

/* ============================
   Search Passwords
   Regex metacharacters are escaped to prevent regex injection
   and ReDoS via user-supplied search terms.
============================ */
const searchVaults = async (userId, query) => {
  const safe = String(query).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  return await Vault.find({
    user: userId,
    $or: [
      { websiteName: { $regex: safe, $options: "i" } },
      { username: { $regex: safe, $options: "i" } },
      { email: { $regex: safe, $options: "i" } },
    ],
  }).select("-passwordFingerprint");
};

/* ============================
   Get By Category
============================ */
const getVaultsByCategory = async (userId, category) => {
  return await Vault.find({
    user: userId,
    category,
  }).select("-passwordFingerprint");
};

/* ============================
   Get Favourites
============================ */
const getFavouriteVaults = async (userId) => {
  return await Vault.find({
    user: userId,
    favourite: true,
  }).select("-passwordFingerprint");
};

/* ============================
   Toggle Favourite
============================ */
const toggleFavourite = async (userId, vaultId) => {
  const vault = await Vault.findOne({
    _id: vaultId,
    user: userId,
  });

  if (!vault) {
    throw new Error("Password not found");
  }

  vault.favourite = !vault.favourite;

  await vault.save();

  const result = vault.toObject();
  delete result.passwordFingerprint;

  return result;
};

module.exports = {
  createVault,
  getAllVaults,
  getVaultById,
  updateVault,
  deleteVault,
  searchVaults,
  getVaultsByCategory,
  getFavouriteVaults,
  toggleFavourite,
};