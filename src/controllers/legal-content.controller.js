const {legalContentService} = require('../services');
const asyncHandler = require('../utils/asyncHandler');

const getPrivacyPolicy = asyncHandler(async (req, res) => {
  const privacyPolicy = await legalContentService.getPrivacyPolicy();

  res.status(200).json({
    success: true,
    message: 'Privacy policy fetched successfully',
    data: privacyPolicy,
    privacyPolicy,
  });
});

const getTermsAndConditions = asyncHandler(async (req, res) => {
  const termsAndConditions = await legalContentService.getTermsAndConditions();

  res.status(200).json({
    success: true,
    message: 'Terms and conditions fetched successfully',
    data: termsAndConditions,
    termsAndConditions,
  });
});

module.exports = {
  getPrivacyPolicy,
  getTermsAndConditions,
};
