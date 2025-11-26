const { getConnection } = require('../config/database');

class Order {
    // Lấy tất cả đơn hàng
    static async getAll(filters = {}) {
        const connection = await getConnection();
        try {
            let query = `
                SELECT o.*
                FROM orders o
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
                SELECT o.*
                FROM orders o
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
                       p.image as product_image,
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
                `INSERT INTO orders (
                    user_id, total_amount, status, 
                    customer_name, customer_phone, customer_email, 
                    customer_address, customer_city, customer_district, customer_note,
                    payment_method, discount_code, discount_amount
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    orderData.user_id,
                    orderData.total_amount,
                    orderData.status || 'pending',
                    orderData.customer_name || null,
                    orderData.customer_phone || null,
                    orderData.customer_email || null,
                    orderData.customer_address || null,
                    orderData.customer_city || null,
                    orderData.customer_district || null,
                    orderData.customer_note || null,
                    orderData.payment_method || null,
                    orderData.discount_code || null,
                    orderData.discount_amount || 0
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

    // Tạo yêu cầu hoàn/ trả hàng cho đơn hàng
    static async createReturnRequest({ order_id, user_id, reason, description, evidence }) {
        const connection = await getConnection();
        try {
            const [result] = await connection.execute(
                `INSERT INTO order_returns (order_id, user_id, reason, description, evidence)
                 VALUES (?, ?, ?, ?, ?)`,
                [order_id, user_id, reason || null, description || null, evidence || null]
            );
            return result.insertId;
        } finally {
            connection.release();
        }
    }

    // Lấy các yêu cầu hoàn hàng (cho admin, có thể dùng sau này)
    static async getReturnRequests() {
        const connection = await getConnection();
        try {
            const [rows] = await connection.execute(`
                SELECT r.*, o.total_amount, o.status as order_status
                FROM order_returns r
                JOIN orders o ON r.order_id = o.id
                ORDER BY r.created_at DESC
            `);
            return rows;
        } finally {
            connection.release();
        }
    }
}

module.exports = Order;

