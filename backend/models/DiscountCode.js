async function updateDiscountCode(id, { code, description, discount_type, discount_value, min_order_amount, max_uses, valid_from, valid_until }) {
    await pool.query(
        'UPDATE discount_codes SET code=?, description=?, discount_type=?, discount_value=?, min_order_amount=?, max_uses=?, valid_from=?, valid_until=? WHERE id=?',
        [code, description, discount_type, discount_value, min_order_amount, max_uses, valid_from, valid_until, id]
    );
}

async function deleteDiscountCode(id) {
    await pool.query('DELETE FROM discount_codes WHERE id=?', [id]);
}
const { pool } = require('../config/database');


async function createDiscountCode({ code, description, discount_type, discount_value, min_order_amount, max_uses, valid_from, valid_until }) {
    const [result] = await pool.query(
        'INSERT INTO discount_codes (code, description, discount_type, discount_value, min_order_amount, max_uses, valid_from, valid_until) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [code, description, discount_type, discount_value, min_order_amount, max_uses, valid_from, valid_until]
    );
    return result.insertId;
}

async function getAllDiscountCodes() {
    const [rows] = await pool.query('SELECT * FROM discount_codes ORDER BY id DESC');
    return rows;
}

module.exports = { createDiscountCode, getAllDiscountCodes, updateDiscountCode, deleteDiscountCode };
