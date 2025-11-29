const { pool } = require('../config/database');

// Validate discount code endpoint
exports.validateDiscountCode = async (req, res) => {
    try {
        const { code, orderAmount } = req.body || {};

        if (!code) {
            return res.status(400).json({ valid: false, message: 'Vui lòng cung cấp mã giảm giá' });
        }

        const [rows] = await pool.query('SELECT * FROM discount_codes WHERE code = ? LIMIT 1', [code]);
        const discount = rows && rows[0];

        if (!discount) {
            return res.json({ valid: false, message: 'Mã giảm giá không tồn tại' });
        }

        if (!discount.is_active) {
            return res.json({ valid: false, message: 'Mã giảm giá đã bị vô hiệu' });
        }

        const now = new Date();
        if (discount.valid_from && new Date(discount.valid_from) > now) {
            return res.json({ valid: false, message: 'Mã chưa có hiệu lực' });
        }
        if (discount.valid_until && new Date(discount.valid_until) < now) {
            return res.json({ valid: false, message: 'Mã đã hết hạn' });
        }

        const minOrder = Number(discount.min_order_amount) || 0;
        const total = Number(orderAmount) || 0;
        if (total < minOrder) {
            return res.json({ valid: false, message: `Yêu cầu đơn hàng tối thiểu ${minOrder}đ để áp mã này` });
        }

        if (discount.max_uses !== null && discount.used_count >= discount.max_uses) {
            return res.json({ valid: false, message: 'Mã giảm giá đã đạt số lượt sử dụng tối đa' });
        }

        // Calculate discount amount
        let discountAmount = 0;
        if (discount.discount_type === 'percentage') {
            discountAmount = Math.floor(total * Number(discount.discount_value) / 100);
        } else {
            discountAmount = Number(discount.discount_value) || 0;
        }

        // Cap discount amount not to exceed order total
        if (discountAmount > total) discountAmount = total;

        return res.json({
            valid: true,
            message: 'Áp dụng mã giảm giá thành công',
            discountCode: {
                id: discount.id,
                code: discount.code,
                discount_type: discount.discount_type,
                discount_value: Number(discount.discount_value),
                discount_amount: discountAmount
            }
        });
    } catch (error) {
        console.error('Validate discount error:', error);
        res.status(500).json({ valid: false, message: 'Lỗi máy chủ khi kiểm tra mã giảm giá' });
    }
};
