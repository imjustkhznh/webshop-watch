const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// Lấy tất cả đơn hàng (admin)
router.get('/orders', authenticateToken, isAdmin, adminController.getOrders);

// Lấy tất cả mã giảm giá (admin)
router.get('/discount-codes', authenticateToken, isAdmin, adminController.getDiscountCodes);

// Tạo mã giảm giá mới
router.post('/discount-codes', authenticateToken, isAdmin, adminController.createDiscountCode);



module.exports = router;

// Cập nhật mã giảm giá
router.put('/discount-codes/:id', authenticateToken, isAdmin, adminController.updateDiscountCode);

// Xóa mã giảm giá
router.delete('/discount-codes/:id', authenticateToken, isAdmin, adminController.deleteDiscountCode);
