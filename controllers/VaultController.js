const {
  createVault,
  getAllVaults,
  getVaultById,
  updateVault,
  deleteVault,
} = require("../services/vaultService");

/* ===========================================
   Create Password
=========================================== */
const addPassword = async (req, res) => {
  try {
    const vault = await createVault(req.user._id, req.body);

    res.status(201).json({
      success: true,
      message: "Password saved successfully",
      data: vault,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

/* ===========================================
   Get All Passwords
=========================================== */
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

/* ===========================================
   Get Single Password
=========================================== */
const getPassword = async (req, res) => {
  try {

    const vault = await getVaultById(
      req.user._id,
      req.params.id
    );

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

/* ===========================================
   Update Password
=========================================== */
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

/* ===========================================
   Delete Password
=========================================== */
const removePassword = async (req, res) => {
  try {

    await deleteVault(
      req.user._id,
      req.params.id
    );

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

module.exports = {
  addPassword,
  getPasswords,
  getPassword,
  editPassword,
  removePassword,
};