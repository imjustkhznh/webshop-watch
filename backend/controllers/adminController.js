// Cập nhật mã giảm giá
exports.updateDiscountCode = async (req, res) => {
    try {
        const id = req.params.id;
        const {
            code,
            description,
            discount_type,
            discount_value,
            min_order_amount,
            max_uses,
            valid_from,
            valid_until
        } = req.body;
        await DiscountCode.updateDiscountCode(id, {
            code,
            description,
            discount_type,
            discount_value,
            min_order_amount,
            max_uses,
            valid_from,
            valid_until
        });
        res.json({ success: true, message: 'Discount code updated!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Xóa mã giảm giá
exports.deleteDiscountCode = async (req, res) => {
    try {
        const id = req.params.id;
        await DiscountCode.deleteDiscountCode(id);
        res.json({ success: true, message: 'Discount code deleted!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
const DiscountCode = require('../models/DiscountCode');

// Tạo mã giảm giá mới
exports.createDiscountCode = async (req, res) => {
    try {
        const {
            code,
            description,
            discount_type,
            discount_value,
            min_order_amount,
            max_uses,
            valid_from,
            valid_until
        } = req.body;
        const id = await DiscountCode.createDiscountCode({
            code,
            description,
            discount_type,
            discount_value,
            min_order_amount,
            max_uses,
            valid_from,
            valid_until
        });
        res.json({ success: true, id, message: 'Discount code created!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
// Admin controller mẫu

const Order = require('../models/Order');

exports.getOrders = async (req, res) => {
    try {
        const orders = await Order.getAll();
        res.json({
            success: true,
            orders
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getDiscountCodes = async (req, res) => {
    try {
        const discountCodes = await DiscountCode.getAllDiscountCodes();
        res.json({ success: true, discountCodes });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
