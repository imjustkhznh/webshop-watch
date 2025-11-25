const { pool } = require('../config/database');

// Ví dụ: Lấy tất cả brands
async function getAllBrands() {
    const [rows] = await pool.query('SELECT * FROM brands');
    return rows;
}

// Thêm brand mới (chỉ có name)
async function createBrand({ name }) {
    const [result] = await pool.query(
        'INSERT INTO brands (name) VALUES (?)',
        [name]
    );
    return result.insertId;
}
// Update brand by id (chỉ có name)
async function updateBrandById(id, { name }) {
    const [result] = await pool.query(
        'UPDATE brands SET name = ? WHERE id = ?',
        [name, id]
    );
    return result.affectedRows > 0;
}

// Lấy brand theo id
async function getBrandById(id) {
    const [rows] = await pool.query('SELECT * FROM brands WHERE id = ?', [id]);
    return rows;
}

module.exports = {
    getAllBrands,
    getBrandById,
    createBrand,
    updateBrandById
};
