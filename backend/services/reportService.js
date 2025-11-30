const { getConnection } = require('../config/database');
const Order = require('../models/Order');

class ReportService {
    /**
     * Get summary statistics
     * @returns {Promise<Object>} - Summary data (orders, revenue, customers, stock)
     */
    static async getSummary() {
        const connection = await getConnection();
        try {
            const [orderStats] = await connection.execute(`
                SELECT 
                    COUNT(*) as total_orders,
                    COALESCE(SUM(CASE WHEN status IN ('delivered', 'completed') THEN total_amount ELSE 0 END), 0) as revenue
                FROM orders
            `);
            const [customerStats] = await connection.execute(`
                SELECT COUNT(*) as new_customers
                FROM users
                WHERE role = 'customer' AND DATE(created_at) = CURDATE()
            `);
            const [stockStats] = await connection.execute(`
                SELECT COALESCE(SUM(stock), 0) as stock
                FROM products
            `);

            return {
                order_count: orderStats[0]?.total_orders || 0,
                revenue: Number(orderStats[0]?.revenue || 0),
                new_customers: customerStats[0]?.new_customers || 0,
                stock: stockStats[0]?.stock || 0
            };
        } finally {
            connection.release();
        }
    }

    /**
     * Get revenue by brand (for pie chart)
     * @returns {Promise<Array>} - Brand revenue data
     */
    static async getBrandRevenue() {
        const connection = await getConnection();
        try {
            const [rows] = await connection.execute(`
                SELECT b.name as brand, COALESCE(SUM(o.total_amount),0) as revenue
                FROM brands b
                LEFT JOIN products p ON p.brand_id = b.id
                LEFT JOIN order_details od ON od.product_id = p.id
                LEFT JOIN orders o ON o.id = od.order_id AND o.status IN ('delivered','completed')
                GROUP BY b.id
                ORDER BY revenue DESC
            `);
            return rows.map(r => ({ brand: r.brand, revenue: Number(r.revenue) }));
        } finally {
            connection.release();
        }
    }

    /**
     * Get daily revenue (for line chart)
     * @returns {Promise<Array>} - Daily revenue data
     */
    static async getDailyRevenue() {
        const daily = await Order.getRevenue();
        return daily.map(row => ({
            date: row.date,
            revenue: row.total_revenue || 0
        }));
    }

    /**
     * Get monthly revenue (for bar chart)
     * @returns {Promise<Array>} - Monthly revenue data
     */
    static async getMonthlyRevenue() {
        const connection = await getConnection();
        try {
            const [rows] = await connection.execute(`
                SELECT YEAR(created_at) as year, MONTH(created_at) as month, COALESCE(SUM(total_amount),0) as revenue
                FROM orders
                WHERE status IN ('delivered','completed')
                GROUP BY YEAR(created_at), MONTH(created_at)
                ORDER BY YEAR(created_at), MONTH(created_at)
                LIMIT 12
            `);
            return rows.map(r => ({
                year: r.year,
                month: r.month,
                revenue: Number(r.revenue)
            }));
        } finally {
            connection.release();
        }
    }
}

module.exports = ReportService;
