const { pool } = require('../config/database');

// Ví dụ: Lấy tất cả brands
async function getAllBrands() {
    const [rows] = await pool.query('SELECT * FROM brands');
    return rows;
}

// Ví dụ: Thêm brand mới
async function createBrand({ name, description, logo, is_active }) {
    const [result] = await pool.query(
        'INSERT INTO brands (name, description, logo, is_active) VALUES (?, ?, ?, ?)',
        [name, description, logo, is_active]
    );
    return result.insertId;
}

// Lấy brand theo id
async function getBrandById(id) {
    const [rows] = await pool.query('SELECT * FROM brands WHERE id = ?', [id]);
    return rows;
}

module.exports = {
    getAllBrands,
    getBrandById,
    createBrand
};
