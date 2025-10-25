const { getConnection } = require('../config/database');

class Order {
    // Lấy tất cả đơn hàng
    static async getAll(filters = {}) {
        const connection = await getConnection();
        try {
            let query = `
                SELECT o.*, 
                       u.full_name as customer_name,
                       u.email as customer_email,
                       u.phone as customer_phone
                FROM orders o
                LEFT JOIN users u ON o.user_id = u.id
                WHERE 1=1
            `;
            const params = [];

            if (filters.user_id) {
                query += ' AND o.user_id = ?';
                params.push(filters.user_id);
            }

            if (filters.status) {
                query += ' AND o.status = ?';
                params.push(filters.status);
            }

            query += ' ORDER BY o.created_at DESC';

            const [orders] = await connection.execute(query, params);
            return orders;
        } finally {
            connection.release();
        }
    }

    // Lấy đơn hàng theo ID
    static async findById(id) {
        const connection = await getConnection();
        try {
            const [orders] = await connection.execute(`
                SELECT o.*, 
                       u.full_name as customer_name,
                       u.email as customer_email,
                       u.phone as customer_phone,
                       u.address as customer_address
                FROM orders o
                LEFT JOIN users u ON o.user_id = u.id
                WHERE o.id = ?
            `, [id]);
            return orders[0];
        } finally {
            connection.release();
        }
    }

    // Lấy chi tiết đơn hàng
    static async getOrderDetails(orderId) {
        const connection = await getConnection();
        try {
            const [details] = await connection.execute(`
                SELECT od.*, 
                       p.name as product_name,
                       p.image_url as product_image,
                       b.name as brand_name
                FROM order_details od
                LEFT JOIN products p ON od.product_id = p.id
                LEFT JOIN brands b ON p.brand_id = b.id
                WHERE od.order_id = ?
            `, [orderId]);
            return details;
        } finally {
            connection.release();
        }
    }

    // Tạo đơn hàng mới
    static async create(orderData) {
        const connection = await getConnection();
        try {
            await connection.beginTransaction();

            // Tạo order
            const [orderResult] = await connection.execute(
                `INSERT INTO orders (user_id, total_amount, status, shipping_address, payment_method) 
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    orderData.user_id,
                    orderData.total_amount,
                    orderData.status || 'pending',
                    orderData.shipping_address,
                    orderData.payment_method
                ]
            );

            const orderId = orderResult.insertId;

            // Tạo order details
            if (orderData.items && orderData.items.length > 0) {
                for (const item of orderData.items) {
                    await connection.execute(
                        `INSERT INTO order_details (order_id, product_id, quantity, price) 
                         VALUES (?, ?, ?, ?)`,
                        [orderId, item.product_id, item.quantity, item.price]
                    );

                    // Cập nhật stock
                    await connection.execute(
                        'UPDATE products SET stock = stock - ? WHERE id = ?',
                        [item.quantity, item.product_id]
                    );
                }
            }

            await connection.commit();
            return orderId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Cập nhật trạng thái đơn hàng
    static async updateStatus(id, status) {
        const connection = await getConnection();
        try {
            const [result] = await connection.execute(
                'UPDATE orders SET status = ? WHERE id = ?',
                [status, id]
            );
            return result.affectedRows > 0;
        } finally {
            connection.release();
        }
    }

    // Xóa đơn hàng
    static async delete(id) {
        const connection = await getConnection();
        try {
            await connection.beginTransaction();

            await connection.execute('DELETE FROM order_details WHERE order_id = ?', [id]);
            await connection.execute('DELETE FROM orders WHERE id = ?', [id]);

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Thống kê doanh thu
    static async getRevenue(filters = {}) {
        const connection = await getConnection();
        try {
            let query = `
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as order_count,
                    SUM(total_amount) as total_revenue
                FROM orders
                WHERE status IN ('delivered', 'completed')
            `;
            const params = [];

            if (filters.start_date) {
                query += ' AND created_at >= ?';
                params.push(filters.start_date);
            }

            if (filters.end_date) {
                query += ' AND created_at <= ?';
                params.push(filters.end_date);
            }

            query += ' GROUP BY DATE(created_at) ORDER BY date DESC';

            const [revenue] = await connection.execute(query, params);
            return revenue;
        } finally {
            connection.release();
        }
    }
}

module.exports = Order;

