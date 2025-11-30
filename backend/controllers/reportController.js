const ReportService = require('../services/reportService');

exports.getSummary = async (req, res) => {
    try {
        const summary = await ReportService.getSummary();
        res.json({
            success: true,
            summary
        });
    } catch (err) {
        console.error('Error getting report summary:', err);
        res.status(500).json({ success: false, error: 'Lỗi lấy tổng quan báo cáo' });
    }
};

// API: /api/reports/brand-revenue (pie chart)
exports.getBrandRevenue = async (req, res) => {
    try {
        const brands = await ReportService.getBrandRevenue();
        res.json({
            success: true,
            brands
        });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Lỗi lấy doanh thu theo thương hiệu' });
    }
};

// API: /api/reports/daily-revenue (line chart)
exports.getDailyRevenue = async (req, res) => {
    try {
        const daily = await ReportService.getDailyRevenue();
        res.json({
            success: true,
            daily
        });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Lỗi lấy dữ liệu doanh thu theo ngày' });
    }
};

// API: /api/reports/monthly-revenue (bar chart)
exports.getMonthlyRevenue = async (req, res) => {
    try {
        const monthly = await ReportService.getMonthlyRevenue();
        res.json({
            success: true,
            monthly
        });
    } catch (err) {
        console.error('Error getting monthly revenue:', err);
        res.status(500).json({ success: false, error: 'Lỗi lấy doanh thu theo tháng' });
    }
};
