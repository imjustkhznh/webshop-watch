const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Tất cả routes cần authentication
router.use(authenticateToken);

// Lấy tất cả đơn hàng (Admin xem tất cả, Customer chỉ xem của mình)
router.get('/', orderController.getAllOrders);

// Lấy đơn hàng theo ID
router.get('/:id', orderController.getOrderById);

// Tạo đơn hàng mới (Customer & Admin)
router.post('/', orderController.createOrder);

// Admin only routes
router.put('/:id/status', isAdmin, orderController.updateOrderStatus);
router.delete('/:id', isAdmin, orderController.deleteOrder);
router.get('/stats/revenue', isAdmin, orderController.getRevenue);

module.exports = router;

