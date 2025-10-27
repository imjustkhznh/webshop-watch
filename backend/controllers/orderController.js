const Order = require('../models/Order');

// Lấy tất cả đơn hàng
exports.getAllOrders = async (req, res) => {
    try {
        const { user_id, status } = req.query;
        
        // Nếu là customer, chỉ xem đơn hàng của mình
        const filters = {};
        if (req.user.role === 'customer') {
            filters.user_id = req.user.id;
        } else if (user_id) {
            filters.user_id = user_id;
        }
        
        if (status) {
            filters.status = status;
        }

        const orders = await Order.getAll(filters);
        
        // Load items for each order
        for (let order of orders) {
            const items = await Order.getOrderDetails(order.id);
            order.items = items;
        }
        
        res.json({ orders });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Lấy đơn hàng theo ID
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Kiểm tra quyền truy cập
        if (req.user.role === 'customer' && order.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Lấy chi tiết đơn hàng
        const details = await Order.getOrderDetails(order.id);
        order.items = details;

        res.json({ order });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Tạo đơn hàng mới
exports.createOrder = async (req, res) => {
    try {
        const {
            items,
            total_amount,
            shipping_address,
            payment_method,
            customer_name,
            customer_phone,
            customer_email,
            customer_address,
            customer_city,
            customer_district,
            customer_note,
            discount_code,
            discount_amount
        } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Order items are required' });
        }

        if (!total_amount) {
            return res.status(400).json({ error: 'Total amount is required' });
        }

        const orderId = await Order.create({
            user_id: req.user.id,
            items,
            total_amount,
            customer_name,
            customer_phone,
            customer_email,
            customer_address,
            customer_city,
            customer_district,
            customer_note,
            payment_method,
            discount_code,
            discount_amount,
            status: 'pending'
        });

        res.status(201).json({
            message: 'Order created successfully',
            orderId
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Cập nhật trạng thái đơn hàng (Admin only)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }

        const validStatuses = ['pending', 'processing', 'shipping', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const updated = await Order.updateStatus(req.params.id, status);

        if (!updated) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json({ message: 'Order status updated successfully' });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Xóa đơn hàng (Admin only)
exports.deleteOrder = async (req, res) => {
    try {
        await Order.delete(req.params.id);
        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        console.error('Delete order error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Thống kê doanh thu (Admin only)
exports.getRevenue = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        
        const revenue = await Order.getRevenue({
            start_date,
            end_date
        });

        res.json({ revenue });
    } catch (error) {
        console.error('Get revenue error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

