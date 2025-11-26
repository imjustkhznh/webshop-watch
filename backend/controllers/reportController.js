// Report controller mẫu

exports.getSummary = async (req, res) => {
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

        const summary = {
            order_count: orderStats[0]?.total_orders || 0,
            revenue: Number(orderStats[0]?.revenue || 0),
            new_customers: customerStats[0]?.new_customers || 0,
            stock: stockStats[0]?.stock || 0
        };

        res.json({
            success: true,
            summary
        });
    } catch (err) {
        console.error('Error getting report summary:', err);
        res.status(500).json({ success: false, error: 'Lỗi lấy tổng quan báo cáo' });
    } finally {
        connection.release();
    }
};

const Order = require('../models/Order');
const Brand = require('../models/Brand');
const { getConnection } = require('../config/database');

// API: /api/reports/brand-revenue (pie chart)
exports.getBrandRevenue = async (req, res) => {
    try {
        const connection = await getConnection();
        const [rows] = await connection.execute(`
            SELECT b.name as brand, COALESCE(SUM(o.total_amount),0) as revenue
            FROM brands b
            LEFT JOIN products p ON p.brand_id = b.id
            LEFT JOIN order_details od ON od.product_id = p.id
            LEFT JOIN orders o ON o.id = od.order_id AND o.status IN ('delivered','completed')
            GROUP BY b.id
            ORDER BY revenue DESC
        `);
        connection.release();
        res.json({
            success: true,
            brands: rows.map(r => ({ brand: r.brand, revenue: Number(r.revenue) }))
        });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Lỗi lấy doanh thu theo thương hiệu' });
    }
};

// API: /api/reports/daily-revenue (line chart)
exports.getDailyRevenue = async (req, res) => {
    try {
        const daily = await Order.getRevenue();
        res.json({
            success: true,
            daily: daily.map(row => ({
                date: row.date,
                revenue: row.total_revenue || 0
            }))
        });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Lỗi lấy dữ liệu doanh thu theo ngày' });
    }
};

// API: /api/reports/monthly-revenue (bar chart)
exports.getMonthlyRevenue = async (req, res) => {
    try {
        const connection = await getConnection();
        const [rows] = await connection.execute(`
            SELECT YEAR(created_at) as year, MONTH(created_at) as month, COALESCE(SUM(total_amount),0) as revenue
            FROM orders
            WHERE status IN ('delivered','completed')
            GROUP BY YEAR(created_at), MONTH(created_at)
            ORDER BY YEAR(created_at), MONTH(created_at)
            LIMIT 12
        `);
        connection.release();
        res.json({
            success: true,
            monthly: rows.map(r => ({
                year: r.year,
                month: r.month,
                revenue: Number(r.revenue)
            }))
        });
    } catch (err) {
        console.error('Error getting monthly revenue:', err);
        res.status(500).json({ success: false, error: 'Lỗi lấy doanh thu theo tháng' });
    }
};
