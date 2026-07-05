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

/* ============================
   Create Password
============================ */
const addPassword = async (req, res) => {
  try {
    const vault = await createVault(req.user._id, req.body);

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
};