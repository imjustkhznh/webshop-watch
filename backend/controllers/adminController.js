const AdminService = require('../services/adminService');
const DiscountService = require('../services/discountService');

// Tạo mã giảm giá mới
exports.createDiscountCode = async (req, res) => {
    try {
        const id = await DiscountService.createDiscountCode(req.body);
        res.json({ success: true, id, message: 'Discount code created!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Cập nhật mã giảm giá
exports.updateDiscountCode = async (req, res) => {
    try {
        await DiscountService.updateDiscountCode(req.params.id, req.body);
        res.json({ success: true, message: 'Discount code updated!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Xóa mã giảm giá
exports.deleteDiscountCode = async (req, res) => {
    try {
        await DiscountService.deleteDiscountCode(req.params.id);
        res.json({ success: true, message: 'Discount code deleted!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Lấy tất cả đơn hàng cho admin
exports.getOrders = async (req, res) => {
    try {
        const orders = await AdminService.getOrders();
        res.json({
            success: true,
            orders
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Lấy tất cả mã giảm giá cho admin
exports.getDiscountCodes = async (req, res) => {
    try {
        const discountCodes = await AdminService.getDiscountCodes();
        res.json({ success: true, discountCodes });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
