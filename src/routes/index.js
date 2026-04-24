const express = require('express');

const authRoutes = require('./auth.routes');
const contactRoutes = require('./contact.routes');
const dashboardRoutes = require('./dashboard.routes');
const reportsRoutes = require('./reports.routes');
const transactionRoutes = require('./transaction.routes');

const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API health check passed',
  });
});

router.use('/auth', authRoutes);
router.use('/contacts', contactRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportsRoutes);
router.use('/transactions', transactionRoutes);

module.exports = router;
