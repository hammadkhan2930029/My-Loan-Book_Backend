const {dashboardService} = require('../services');
const asyncHandler = require('../utils/asyncHandler');

const getDashboard = asyncHandler(async (req, res) => {
  const dashboard = await dashboardService.getDashboardData(req.user.id);

  res.status(200).json({
    success: true,
    message: 'Dashboard fetched successfully',
    dashboard,
  });
});

module.exports = {
  getDashboard,
};
