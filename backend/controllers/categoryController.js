// Category controller: try reading from database first
const { pool } = require('../config/database');

exports.getCategories = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, name FROM categories ORDER BY id ASC');
        // If table empty, fall back to static list
        if (!rows || rows.length === 0) {
            return res.json({
                success: true,
                categories: [
                    { id: 1, name: 'Đồng hồ nam' },
                    { id: 2, name: 'Đồng hồ nữ' },
                    { id: 3, name: 'Phụ kiện' },
                    { id: 4, name: 'Dây đồng hồ' },
                    { id: 5, name: 'Đồng hồ treo tường' },
                    { id: 6, name: 'Khác' }
                ]
            });
        }

        res.json({ success: true, categories: rows });
    } catch (error) {
        console.error('Error fetching categories from DB:', error && error.message ? error.message : error);
        // On error, return static list so frontend still works
        res.json({
            success: true,
            categories: [
                { id: 1, name: 'Đồng hồ nam' },
                { id: 2, name: 'Đồng hồ nữ' },
                { id: 3, name: 'Phụ kiện' },
                { id: 4, name: 'Dây đồng hồ' },
                { id: 5, name: 'Đồng hồ treo tường' },
                { id: 6, name: 'Khác' }
            ]
        });
    }
};
