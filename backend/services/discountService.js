const { pool } = require('../config/database');
const DiscountCode = require('../models/DiscountCode');

class DiscountService {
    /**
     * Validate discount code
     * @param {string} code - Discount code
     * @param {number} orderAmount - Order amount
     * @returns {Promise<Object>} - Validation result with discount info
     * @throws {Error} - If code is invalid
     */
    static async validateDiscountCode(code, orderAmount) {
        if (!code) {
            throw new Error('Vui lòng cung cấp mã giảm giá');
        }

        const [rows] = await pool.query('SELECT * FROM discount_codes WHERE code = ? LIMIT 1', [code]);
        const discount = rows && rows[0];

        if (!discount) {
            throw new Error('Mã giảm giá không tồn tại');
        }

        if (!discount.is_active) {
            throw new Error('Mã giảm giá đã bị vô hiệu');
        }

        const now = new Date();
        if (discount.valid_from && new Date(discount.valid_from) > now) {
            throw new Error('Mã chưa có hiệu lực');
        }
        if (discount.valid_until && new Date(discount.valid_until) < now) {
            throw new Error('Mã đã hết hạn');
        }

        const minOrder = Number(discount.min_order_amount) || 0;
        const total = Number(orderAmount) || 0;
        if (total < minOrder) {
            throw new Error(`Yêu cầu đơn hàng tối thiểu ${minOrder}đ để áp mã này`);
        }

        if (discount.max_uses !== null && discount.used_count >= discount.max_uses) {
            throw new Error('Mã giảm giá đã đạt số lượt sử dụng tối đa');
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

        return {
            valid: true,
            discountCode: {
                id: discount.id,
                code: discount.code,
                discount_type: discount.discount_type,
                discount_value: Number(discount.discount_value),
                discount_amount: discountAmount
            }
        };
    }

    /**
     * Get all discount codes (Admin only)
     * @returns {Promise<Array>} - List of discount codes
     */
    static async getAllDiscountCodes() {
        return await DiscountCode.getAllDiscountCodes();
    }

    /**
     * Create discount code (Admin only)
     * @param {Object} discountData - Discount code data
     * @returns {Promise<number>} - Created discount code ID
     */
    static async createDiscountCode(discountData) {
        const {
            code,
            description,
            discount_type,
            discount_value,
            min_order_amount,
            max_uses,
            valid_from,
            valid_until
        } = discountData;

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

        return id;
    }

    /**
     * Update discount code (Admin only)
     * @param {number} discountId - Discount code ID
     * @param {Object} discountData - Updated discount code data
     * @returns {Promise<boolean>} - Success status
     */
    static async updateDiscountCode(discountId, discountData) {
        const {
            code,
            description,
            discount_type,
            discount_value,
            min_order_amount,
            max_uses,
            valid_from,
            valid_until
        } = discountData;

        await DiscountCode.updateDiscountCode(discountId, {
            code,
            description,
            discount_type,
            discount_value,
            min_order_amount,
            max_uses,
            valid_from,
            valid_until
        });

        return true;
    }

    /**
     * Delete discount code (Admin only)
     * @param {number} discountId - Discount code ID
     * @returns {Promise<boolean>} - Success status
     */
    static async deleteDiscountCode(discountId) {
        await DiscountCode.deleteDiscountCode(discountId);
        return true;
    }
}

module.exports = DiscountService;

