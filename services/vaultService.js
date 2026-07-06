const Vault = require("../models/Vault");
const { encrypt, decrypt } = require("../utils/encrypt");

/* ============================
   Create Password
============================ */
const createVault = async (userId, data) => {
  const existingVaults = await Vault.find({
  user: userId,
});

for (const vault of existingVaults) {
  const existingPassword = decrypt(vault.password);

  if (existingPassword === data.password) {
    throw new Error(
      "This password is already used in another account."
    );
  }
}

  return await Vault.create({
    user: userId,
    websiteName: data.websiteName,
    websiteUrl: data.websiteUrl,
    username: data.username,
    email: data.email,
    password: encrypt(data.password),
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

    obj.password = decrypt(vault.password);

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

  // Prevent password reuse
  if (data.password !== undefined) {
    const allVaults = await Vault.find({
      user: userId,
      _id: { $ne: vaultId },
    });

    for (const item of allVaults) {
      try {
        const existingPassword = decrypt(item.password);

        if (existingPassword === data.password) {
          throw new Error(
            "This password is already used in another account."
          );
        }
      } catch (err) {
        if (
          err.message ===
          "This password is already used in another account."
        ) {
          throw err;
        }
      }
    }

    vault.password = encrypt(data.password);
  }
  const expiry = new Date();
expiry.setDate(expiry.getDate() + 90);

vault.passwordExpiry = expiry;

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

  return vault;
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
============================ */
const searchVaults = async (userId, query) => {
  return await Vault.find({
    user: userId,
    $or: [
      { websiteName: { $regex: query, $options: "i" } },
      { username: { $regex: query, $options: "i" } },
      { email: { $regex: query, $options: "i" } }
    ]
  });
};

/* ============================
   Get By Category
============================ */
const getVaultsByCategory = async (userId, category) => {
  return await Vault.find({
    user: userId,
    category,
  });
};

/* ============================
   Get Favourites
============================ */
const getFavouriteVaults = async (userId) => {
  return await Vault.find({
    user: userId,
    favourite: true,
  });
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

  return vault;
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