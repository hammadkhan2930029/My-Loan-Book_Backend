const express = require('express');

const {dashboardController} = require('../controllers');
const {protect} = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/', dashboardController.getDashboard);

module.exports = router;
