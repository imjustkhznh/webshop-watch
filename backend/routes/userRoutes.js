const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Lấy profile (Customer & Admin)
router.get('/profile', authenticateToken, userController.getProfile);

// Cập nhật profile (Customer & Admin)
router.put('/profile', authenticateToken, userController.updateProfile);

// Đổi mật khẩu (Customer & Admin)
router.post('/change-password', authenticateToken, userController.changePassword);

// Lấy tất cả customers (Admin only)
router.get('/customers', authenticateToken, isAdmin, userController.getAllCustomers);

// Xóa customer (Admin only)
router.delete('/customers/:id', authenticateToken, isAdmin, userController.deleteCustomer);

module.exports = router;

