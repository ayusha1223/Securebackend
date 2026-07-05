const Vault = require("../models/Vault");
const { encrypt } = require("../utils/encrypt");

const createVault = async (userId, data) => {
  const vault = await Vault.create({
    user: userId,
    websiteName: data.websiteName,
    websiteUrl: data.websiteUrl,
    username: data.username,
    email: data.email,
    password: encrypt(data.password),
    category: data.category,
    notes: data.notes,
    favourite: data.favourite,
    tags: data.tags,
  });

  return vault;
};

module.exports = {
  createVault,
};