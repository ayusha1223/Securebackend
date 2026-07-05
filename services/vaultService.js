const Vault = require("../models/Vault");
const { encrypt, decrypt } = require("../utils/encrypt");

/* ============================
   Create Password
============================ */
const createVault = async (userId, data) => {
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
  return await Vault.find({ user: userId }).sort({
    createdAt: -1,
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

  if (data.websiteName !== undefined)
    vault.websiteName = data.websiteName;

  if (data.websiteUrl !== undefined)
    vault.websiteUrl = data.websiteUrl;

  if (data.username !== undefined)
    vault.username = data.username;

  if (data.email !== undefined)
    vault.email = data.email;

  if (data.password !== undefined)
    vault.password = encrypt(data.password);

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

module.exports = {
  createVault,
  getAllVaults,
  getVaultById,
  updateVault,
  deleteVault,
};