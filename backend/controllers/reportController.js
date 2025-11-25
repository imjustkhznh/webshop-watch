// Report controller mẫu

exports.getSummary = (req, res) => {
    res.json({
        success: true,
        summary: {}
    });
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
