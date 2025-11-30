const OrderService = require('../services/orderService');

// Lấy tất cả đơn hàng
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await OrderService.getAllOrders(req.query, req.user);
        res.json({ orders });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Lấy đơn hàng theo ID
exports.getOrderById = async (req, res) => {
    try {
        const order = await OrderService.getOrderById(req.params.id, req.user);
        res.json({ order });
    } catch (error) {
        console.error('Get order error:', error);
        const statusCode = error.message === 'Order not found' ? 404 : 
                          error.message === 'Access denied' ? 403 : 500;
        res.status(statusCode).json({ error: error.message || 'Internal server error' });
    }
};

// Tạo đơn hàng mới
exports.createOrder = async (req, res) => {
    try {
        const orderId = await OrderService.createOrder(req.body, req.user.id);
        res.status(201).json({
            message: 'Order created successfully',
            orderId
        });
    } catch (error) {
        console.error('Create order error:', error);
        const statusCode = error.message.includes('required') ? 400 : 500;
        res.status(statusCode).json({ error: error.message || 'Internal server error' });
    }
};

// Cập nhật trạng thái đơn hàng (Admin only)
exports.updateOrderStatus = async (req, res) => {
    try {
        await OrderService.updateOrderStatus(req.params.id, req.body.status);
        res.json({ message: 'Order status updated successfully' });
    } catch (error) {
        console.error('Update order status error:', error);
        const statusCode = error.message === 'Order not found' ? 404 : 
                          error.message === 'Invalid status' ? 400 : 500;
        res.status(statusCode).json({ error: error.message || 'Internal server error' });
    }
};

// Cập nhật trạng thái đơn hàng cho Customer (chỉ cho phép hủy/hoàn đơn của chính mình)
exports.updateOrderStatusCustomer = async (req, res) => {
    try {
        await OrderService.updateOrderStatusCustomer(req.params.id, req.body.status, req.user);
        res.json({ success: true, message: 'Order status updated successfully' });
    } catch (error) {
        console.error('Update customer order status error:', error);
        const statusCode = error.message === 'Order not found' ? 404 : 
                          error.message === 'Forbidden' ? 403 : 
                          error.message.includes('Invalid status') ? 400 : 500;
        res.status(statusCode).json({ error: error.message || 'Internal server error' });
    }
};

// Tạo yêu cầu hoàn/ trả hàng từ phía khách hàng
exports.createReturnRequest = async (req, res) => {
    try {
        const requestId = await OrderService.createReturnRequest(req.params.id, req.body, req.user);
        res.status(201).json({
            success: true,
            message: 'Yêu cầu hoàn đơn đã được gửi',
            requestId
        });
    } catch (error) {
        console.error('Create return request error:', error);
        const statusCode = error.message === 'Order not found' ? 404 : 
                          error.message === 'Forbidden' || error.message === 'Unauthorized' ? 
                          (error.message === 'Unauthorized' ? 401 : 403) : 500;
        res.status(statusCode).json({ error: error.message || 'Internal server error' });
    }
};

// Lấy danh sách yêu cầu hoàn hàng (Admin xem)
exports.getReturnRequests = async (req, res) => {
    try {
        const requests = await OrderService.getReturnRequests();
        res.json({ success: true, requests });
    } catch (error) {
        console.error('Get return requests error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

// Xử lý yêu cầu hoàn đơn (duyệt / từ chối)
exports.processReturnRequest = async (req, res) => {
    try {
        const result = await OrderService.processReturnRequest(req.params.id, req.body.action);
        res.json({ success: true, ...result });
    } catch (error) {
        console.error('Process return request error:', error);
        const statusCode = error.message === 'Return request not found' ? 404 : 
                          error.message === 'Invalid action' ? 400 : 500;
        res.status(statusCode).json({ error: error.message || 'Internal server error' });
    }
};

// Xóa đơn hàng (Admin only)
exports.deleteOrder = async (req, res) => {
    try {
        await OrderService.deleteOrder(req.params.id);
        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        console.error('Delete order error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Thống kê doanh thu (Admin only)
exports.getRevenue = async (req, res) => {
    try {
        const revenue = await OrderService.getRevenue(req.query);
        res.json({ revenue });
    } catch (error) {
        console.error('Get revenue error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
