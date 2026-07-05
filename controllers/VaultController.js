const Vault = require("../models/Vault");
const {
  createVault,
  getAllVaults,
  getVaultById,
  updateVault,
  deleteVault,
  searchVaults,
  getVaultsByCategory,
  getFavouriteVaults,
  toggleFavourite,
} = require("../services/vaultService");

const {
  createAuditLog,
} = require("../services/auditService");


/* ============================
   Create Password
============================ */
const addPassword = async (req, res) => {
  try {
    const vault = await createVault(req.user._id, req.body);
    await createAuditLog({
  user: req.user._id,
  action: "CREATE_PASSWORD",
  resource: "Vault",
  resourceId: vault._id,
  req,
});

    res.status(201).json({
      success: true,
      message: "Password saved successfully",
      data: vault,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================
   Get All Passwords
============================ */
const getPasswords = async (req, res) => {
  try {
    const vaults = await getAllVaults(req.user._id);

    res.status(200).json({
      success: true,
      count: vaults.length,
      data: vaults,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================
   Get One Password
============================ */
const getPassword = async (req, res) => {
  try {
    const vault = await getVaultById(req.user._id, req.params.id);

    res.status(200).json({
      success: true,
      data: vault,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================
   Update Password
============================ */
const editPassword = async (req, res) => {
  try {
    const vault = await updateVault(
      req.user._id,
      req.params.id,
      req.body
    );

    await createAuditLog({
      user: req.user._id,
      action: "UPDATE_PASSWORD",
      resource: "Vault",
      resourceId: vault._id,
      req,
    });

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
      data: vault,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};
/* ============================
   Delete Password
============================ */
const removePassword = async (req, res) => {
  try {
    await deleteVault(req.user._id, req.params.id);

    await createAuditLog({
      user: req.user._id,
      action: "DELETE_PASSWORD",
      resource: "Vault",
      resourceId: req.params.id,
      req,
    });

    res.status(200).json({
      success: true,
      message: "Password deleted successfully",
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};
/* ===========================================
   Password Health Dashboard
=========================================== */
const getPasswordHealth = async (req, res) => {
  try {
    console.log("\n========== PASSWORD HEALTH ==========");

    console.log("req.user:");
    console.log(req.user);

    console.log("Logged User ID:", req.user._id);

    // Find ALL vaults
    const allVaults = await Vault.find();

    console.log("Total Vaults in DB:", allVaults.length);

    allVaults.forEach((v, index) => {
      console.log(
        `${index + 1}. Vault User: ${v.user.toString()} | Website: ${v.websiteName}`
      );
    });

    // Find current user's vaults
    const vaults = await Vault.find({
      user: req.user._id,
    });

    console.log("Vaults Found For Current User:", vaults.length);

    const total = vaults.length;

    let strong = 0;
    let weak = 0;
    let reused = 0;
    let expired = 0;

    const passwordMap = {};

    vaults.forEach((item) => {
      if (item.password.length >= 12) {
        strong++;
      } else {
        weak++;
      }

      if (
        item.passwordExpiry &&
        item.passwordExpiry < new Date()
      ) {
        expired++;
      }

      passwordMap[item.password] =
        (passwordMap[item.password] || 0) + 1;
    });

    Object.values(passwordMap).forEach((count) => {
      if (count > 1) {
        reused += count;
      }
    });

    let score = 100;

    score -= weak * 5;
    score -= reused * 3;
    score -= expired * 4;

    if (score < 0) score = 0;

    res.json({
      success: true,
      data: {
        total,
        strong,
        weak,
        reused,
        expired,
        score,
      },
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ============================
   Search Passwords
============================ */
const searchPasswords = async (req, res) => {
  try {
    const vaults = await searchVaults(
      req.user._id,
      req.query.q || ""
    );

    res.status(200).json({
      success: true,
      count: vaults.length,
      data: vaults,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================
   Get Category
============================ */
const getCategoryPasswords = async (req, res) => {
  try {
    const vaults = await getVaultsByCategory(
      req.user._id,
      req.params.category
    );

    res.status(200).json({
      success: true,
      count: vaults.length,
      data: vaults,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================
   Get Favourites
============================ */
const getFavourites = async (req, res) => {
  try {
    const vaults = await getFavouriteVaults(req.user._id);

    res.status(200).json({
      success: true,
      count: vaults.length,
      data: vaults,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================
   Toggle Favourite
============================ */
const favouritePassword = async (req, res) => {
  try {
    const vault = await toggleFavourite(
      req.user._id,
      req.params.id
    );

    res.status(200).json({
      success: true,
      message: "Favourite updated",
      data: vault,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  addPassword,
  getPasswords,
  getPassword,
  editPassword,
  removePassword,
  searchPasswords,
  getCategoryPasswords,
  getFavourites,
  favouritePassword,
  getPasswordHealth,
};