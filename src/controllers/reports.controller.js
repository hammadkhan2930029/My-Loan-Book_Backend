const {reportsService} = require('../services');
const asyncHandler = require('../utils/asyncHandler');

const getReports = asyncHandler(async (req, res) => {
  const reports = await reportsService.getReportsData(req.user.id, {
    month: req.query.month,
    year: req.query.year,
  });

  res.status(200).json({
    success: true,
    message: 'Reports fetched successfully',
    reports,
  });
});

module.exports = {
  getReports,
};
