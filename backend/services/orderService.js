const Order = require('../models/Order');

class OrderService {
    /**
     * Get all orders with filters
     * @param {Object} filters - Filter options (user_id, status)
     * @param {Object} user - Current user (for permission check)
     * @returns {Promise<Array>} - List of orders with items
     */
    static async getAllOrders(filters = {}, user) {
        // If customer, only show their own orders
        const queryFilters = {};
        if (user.role === 'customer') {
            queryFilters.user_id = user.id;
        } else if (filters.user_id) {
            queryFilters.user_id = filters.user_id;
        }

        if (filters.status) {
            queryFilters.status = filters.status;
        }

        const orders = await Order.getAll(queryFilters);

        // Load items for each order
        for (let order of orders) {
            const items = await Order.getOrderDetails(order.id);
            order.items = items;
        }

        return orders;
    }

    /**
     * Get order by ID
     * @param {number} orderId - Order ID
     * @param {Object} user - Current user (for permission check)
     * @returns {Promise<Object>} - Order with items
     * @throws {Error} - If order not found or access denied
     */
    static async getOrderById(orderId, user) {
        const order = await Order.findById(orderId);

        if (!order) {
            throw new Error('Order not found');
        }

        // Check access permission
        if (user.role === 'customer' && order.user_id !== user.id) {
            throw new Error('Access denied');
        }

        // Get order details
        const details = await Order.getOrderDetails(order.id);
        order.items = details;

        return order;
    }

    /**
     * Create new order
     * @param {Object} orderData - Order data
     * @param {number} userId - User ID
     * @returns {Promise<number>} - Created order ID
     * @throws {Error} - If validation fails
     */
    static async createOrder(orderData, userId) {
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
        } = orderData;

        if (!items || items.length === 0) {
            throw new Error('Order items are required');
        }

        if (!total_amount) {
            throw new Error('Total amount is required');
        }

        const orderId = await Order.create({
            user_id: userId,
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

        return orderId;
    }

    /**
     * Update order status (Admin only)
     * @param {number} orderId - Order ID
     * @param {string} status - New status
     * @returns {Promise<boolean>} - Success status
     * @throws {Error} - If order not found or invalid status
     */
    static async updateOrderStatus(orderId, status) {
        if (!status) {
            throw new Error('Status is required');
        }

        // Normalize status from UI to DB values
        // UI: pending, processing, shipping, delivered, cancelled, returned
        // DB: pending, processing, shipped, delivered, cancelled, returned
        if (status === 'shipping') status = 'shipped';

        const validStatuses = ['pending', 'processing', 'shipping', 'shipped', 'delivered', 'cancelled', 'returned'];
        if (!validStatuses.includes(status)) {
            throw new Error('Invalid status');
        }

        const updated = await Order.updateStatus(orderId, status);

        if (!updated) {
            throw new Error('Order not found');
        }

        return true;
    }

    /**
     * Update order status for customer (only cancelled/returned)
     * @param {number} orderId - Order ID
     * @param {string} status - New status (cancelled or returned)
     * @param {Object} user - Current user
     * @returns {Promise<boolean>} - Success status
     * @throws {Error} - If validation fails or access denied
     */
    static async updateOrderStatusCustomer(orderId, status, user) {
        if (!status) {
            throw new Error('Status is required');
        }

        // Only allow cancelled or returned
        if (!['cancelled', 'returned'].includes(status)) {
            throw new Error('Invalid status for customer');
        }

        // Find order and check ownership
        const order = await Order.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        if (!user || (user.role !== 'admin' && order.user_id !== user.id)) {
            throw new Error('Forbidden');
        }

        const updated = await Order.updateStatus(orderId, status);
        if (!updated) {
            throw new Error('Order not found');
        }

        return true;
    }

    /**
     * Create return request
     * @param {number} orderId - Order ID
     * @param {Object} returnData - Return request data
     * @param {Object} user - Current user
     * @returns {Promise<number>} - Created return request ID
     * @throws {Error} - If validation fails or access denied
     */
    static async createReturnRequest(orderId, returnData, user) {
        const { reason, description, evidence } = returnData;

        if (!user) {
            throw new Error('Unauthorized');
        }

        const order = await Order.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        // Only allow return request for own orders
        if (order.user_id !== user.id && user.role !== 'admin') {
            throw new Error('Forbidden');
        }

        // Only allow return when order is delivered
        if (order.status !== 'delivered') {
            throw new Error('Chỉ có thể yêu cầu hoàn hàng khi đơn đã giao');
        }

        const requestId = await Order.createReturnRequest({
            order_id: order.id,
            user_id: user.id,
            reason,
            description,
            evidence
        });

        return requestId;
    }

    /**
     * Get all return requests (Admin only)
     * @returns {Promise<Array>} - List of return requests
     */
    static async getReturnRequests() {
        return await Order.getReturnRequests();
    }

    /**
     * Process return request (approve/reject)
     * @param {number} requestId - Return request ID
     * @param {string} action - Action: 'approve' or 'reject'
     * @returns {Promise<Object>} - Updated status
     * @throws {Error} - If request not found or invalid action
     */
    static async processReturnRequest(requestId, action) {
        if (!['approve', 'reject'].includes(action)) {
            throw new Error('Invalid action');
        }

        const request = await Order.findReturnRequestById(requestId);
        if (!request) {
            throw new Error('Return request not found');
        }

        const newStatus = action === 'approve' ? 'approved' : 'rejected';
        const updated = await Order.updateReturnRequestStatus(request.id, newStatus);
        if (!updated) {
            throw new Error('Failed to update return request');
        }

        if (action === 'approve') {
            await Order.updateStatus(request.order_id, 'returned');
        }

        return { status: newStatus };
    }

    /**
     * Delete order (Admin only)
     * @param {number} orderId - Order ID
     * @returns {Promise<boolean>} - Success status
     */
    static async deleteOrder(orderId) {
        await Order.delete(orderId);
        return true;
    }

    /**
     * Get revenue statistics
     * @param {Object} filters - Filter options (start_date, end_date)
     * @returns {Promise<Object>} - Revenue data
     */
    static async getRevenue(filters = {}) {
        const { start_date, end_date } = filters;

        return await Order.getRevenue({
            start_date,
            end_date
        });
    }
}

module.exports = OrderService;
