const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Lấy profile (Customer & Admin)
router.get('/profile', authenticateToken, userController.getProfile);

// Cập nhật profile (Customer & Admin)
router.put('/profile', authenticateToken, userController.updateProfile);

// Upload avatar (Customer & Admin)
router.post('/upload-avatar', authenticateToken, upload.single('avatar'), userController.uploadAvatar);

// Đổi mật khẩu (Customer & Admin)
router.post('/change-password', authenticateToken, userController.changePassword);

// Lấy tất cả customers (Admin only)
router.get('/customers', authenticateToken, isAdmin, userController.getAllCustomers);

// Xóa customer (Admin only)
router.delete('/customers/:id', authenticateToken, isAdmin, userController.deleteCustomer);

module.exports = router;

