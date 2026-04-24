const express = require('express');

const {legalContentController} = require('../controllers');
const {protect} = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/privacy-policy', legalContentController.getPrivacyPolicy);
router.get('/terms-and-conditions', legalContentController.getTermsAndConditions);

module.exports = router;
