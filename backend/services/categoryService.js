const { pool } = require('../config/database');

class CategoryService {
    // Static fallback categories
    static FALLBACK_CATEGORIES = [
        { id: 1, name: 'Đồng hồ nam' },
        { id: 2, name: 'Đồng hồ nữ' },
        { id: 3, name: 'Phụ kiện' },
        { id: 4, name: 'Dây đồng hồ' },
        { id: 5, name: 'Đồng hồ treo tường' },
        { id: 6, name: 'Khác' }
    ];

    /**
     * Get all categories
     * @returns {Promise<Array>} - List of categories
     */
    static async getCategories() {
        try {
            const [rows] = await pool.query('SELECT id, name FROM categories ORDER BY id ASC');
            
            // If table empty, fall back to static list
            if (!rows || rows.length === 0) {
                return this.FALLBACK_CATEGORIES;
            }

            return rows;
        } catch (error) {
            console.error('Error fetching categories from DB:', error?.message || error);
            // On error, return static list so frontend still works
            return this.FALLBACK_CATEGORIES;
        }
    }
}

module.exports = CategoryService;

