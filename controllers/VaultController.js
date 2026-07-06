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
const {
  analyzePassword,
} = require("../utils/passwordStrength");
const { decrypt } = require("../utils/encrypt");


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
    const vaults = await Vault.find({
      user: req.user._id,
    });

    const weakPasswords = [];
    const reused = [];
    const expired = [];
    const expiringSoon = [];

    const passwordMap = {};

    const today = new Date();

    vaults.forEach((vault) => {
      const plainPassword = decrypt(vault.password);

      const analysis = analyzePassword(plainPassword);

      if (analysis.strength === "Weak") {
        weakPasswords.push(vault);
      }

      if (passwordMap[plainPassword]) {
        reused.push(vault);
      } else {
        passwordMap[plainPassword] = true;
      }

      if (vault.passwordExpiry) {
        const expiry = new Date(vault.passwordExpiry);

        if (expiry < today) {
          expired.push(vault);
        } else {
          const days =
            (expiry - today) /
            (1000 * 60 * 60 * 24);

          if (days <= 7) {
            expiringSoon.push(vault);
          }
        }
      }
    });

    const score =
      vaults.length === 0
        ? 100
        : Math.max(
            0,
            Math.round(
              ((vaults.length -
                weakPasswords.length -
                reused.length -
                expired.length) /
                vaults.length) *
                100
            )
          );

    res.status(200).json({
      success: true,
      data: {
        score,
        vaults,
        weakPasswords,
        reused,
        expired,
        expiringSoon,
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