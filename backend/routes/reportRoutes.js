const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin } = require('../middleware/auth');
const reportController = require('../controllers/reportController');

// Lấy tổng hợp báo cáo (admin)
router.get('/summary', authenticateToken, isAdmin, reportController.getSummary);


// Lấy doanh thu theo ngày (admin)
router.get('/daily-revenue', authenticateToken, isAdmin, reportController.getDailyRevenue);

// Lấy doanh thu theo tháng (admin)
router.get('/monthly-revenue', authenticateToken, isAdmin, reportController.getMonthlyRevenue);

// Lấy doanh thu theo thương hiệu (pie chart)
router.get('/brand-revenue', authenticateToken, isAdmin, reportController.getBrandRevenue);

module.exports = router;
