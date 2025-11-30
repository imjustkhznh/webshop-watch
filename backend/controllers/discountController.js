const DiscountService = require('../services/discountService');

// Validate discount code endpoint
exports.validateDiscountCode = async (req, res) => {
    try {
        const { code, orderAmount } = req.body || {};
        const result = await DiscountService.validateDiscountCode(code, orderAmount);
        res.json({
            valid: true,
            message: 'Áp dụng mã giảm giá thành công',
            ...result
        });
    } catch (error) {
        console.error('Validate discount error:', error);
        res.json({ 
            valid: false, 
            message: error.message || 'Lỗi máy chủ khi kiểm tra mã giảm giá' 
        });
    }
};
