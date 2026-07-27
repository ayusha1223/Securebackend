const {
  getUserLogs,
  getAllLogs,
} = require("../services/auditService");

const myLogs = async (req, res) => {
  try {
    const logs = await getUserLogs(req.user._id);

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const allLogs = async (req, res) => {
  try {
    const logs = await getAllLogs();

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  myLogs,
  allLogs,
};