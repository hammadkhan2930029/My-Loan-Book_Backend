const express = require('express');

const {reportsController} = require('../controllers');
const {protect} = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/', reportsController.getReports);

module.exports = router;
