const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Tất cả routes cần authentication
router.use(authenticateToken);

// Lấy tất cả đơn hàng (Admin xem tất cả, Customer chỉ xem của mình)
router.get('/', orderController.getAllOrders);

// Admin xem danh sách yêu cầu hoàn đơn (đặt TRƯỚC route :id để tránh bị nhầm với id = 'returns')
router.get('/returns', isAdmin, orderController.getReturnRequests);
// Admin xử lý yêu cầu hoàn đơn
router.put('/returns/:id', isAdmin, orderController.processReturnRequest);

// Lấy đơn hàng theo ID
router.get('/:id', orderController.getOrderById);

// Tạo đơn hàng mới (Customer & Admin)
router.post('/', orderController.createOrder);

// Cập nhật trạng thái đơn hàng:
// - Admin: cho mọi đơn hàng
// - Customer: chỉ được hủy/hoàn đơn của chính mình
router.put('/:id/status', isAdmin, orderController.updateOrderStatus);
router.put('/:id/status/customer', orderController.updateOrderStatusCustomer);

// Tạo yêu cầu hoàn đơn (customer)
router.post('/:id/return-request', orderController.createReturnRequest);

// Admin only routes
router.delete('/:id', isAdmin, orderController.deleteOrder);
router.get('/stats/revenue', isAdmin, orderController.getRevenue);

module.exports = router;

