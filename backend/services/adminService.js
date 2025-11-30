const Order = require('../models/Order');
const DiscountCode = require('../models/DiscountCode');

class AdminService {
    /**
     * Get all orders for admin dashboard
     * @returns {Promise<Array>} - List of orders with items info
     */
    static async getOrders() {
        const orders = await Order.getAll();
        const returnRequests = await Order.getReturnRequests();

        const approvedReturnMap = new Set();
        returnRequests.forEach(request => {
            if (request.status === 'approved') {
                approvedReturnMap.add(request.order_id);
            }
        });

        // Attach product info for each order for admin display
        for (const order of orders) {
            if (approvedReturnMap.has(order.id)) {
                order.status = 'returned';
            }

            const details = await Order.getOrderDetails(order.id);
            // Product description string: "Product Name xQuantity, ..."
            order.items = details && details.length
                ? details.map(d => `${d.product_name || 'Sản phẩm'} x${d.quantity}`).join(', ')
                : 'N/A';
        }

        return orders;
    }

    /**
     * Get all discount codes for admin
     * @returns {Promise<Array>} - List of discount codes
     */
    static async getDiscountCodes() {
        return await DiscountCode.getAllDiscountCodes();
    }
}

module.exports = AdminService;
