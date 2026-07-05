const { createVault } = require("../services/vaultService");

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
      message: "Internal Server Error",
    });

  }
};

module.exports = {
  addPassword,
};