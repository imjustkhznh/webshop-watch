const { getConnection } = require('../config/database');

class Product {
    // Lấy tất cả sản phẩm
    static async getAll(filters = {}) {
        const connection = await getConnection();
        try {
            let query = `
                SELECT p.*, b.name as brand_name, c.name as category_name 
                FROM products p
                LEFT JOIN brands b ON p.brand_id = b.id
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE 1=1
            `;
            const params = [];

            if (filters.brand_id) {
                query += ' AND p.brand_id = ?';
                params.push(filters.brand_id);
            }

            if (filters.category_id) {
                query += ' AND p.category_id = ?';
                params.push(filters.category_id);
            }

            if (filters.search) {
                query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
                params.push(`%${filters.search}%`, `%${filters.search}%`);
            }

            query += ' ORDER BY p.created_at DESC';

            if (filters.limit) {
                query += ' LIMIT ?';
                params.push(parseInt(filters.limit));
            }

            if (filters.offset) {
                query += ' OFFSET ?';
                params.push(parseInt(filters.offset));
            }

            const [products] = await connection.execute(query, params);
            return products;
        } finally {
            connection.release();
        }
    }

    // Lấy sản phẩm theo ID
    static async findById(id) {
        const connection = await getConnection();
        try {
            const [products] = await connection.execute(`
                SELECT p.*, b.name as brand_name, c.name as category_name 
                FROM products p
                LEFT JOIN brands b ON p.brand_id = b.id
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.id = ?
            `, [id]);
            return products[0];
        } finally {
            connection.release();
        }
    }

    // Tạo sản phẩm mới
    static async create(productData) {
        const connection = await getConnection();
        try {
            const [result] = await connection.execute(
                `INSERT INTO products (name, description, price, brand_id, category_id, image_url, stock) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    productData.name,
                    productData.description,
                    productData.price,
                    productData.brand_id,
                    productData.category_id,
                    productData.image_url,
                    productData.stock || 0
                ]
            );
            return result.insertId;
        } finally {
            connection.release();
        }
    }

    // Cập nhật sản phẩm
    static async update(id, productData) {
        const connection = await getConnection();
        try {
            const updates = [];
            const values = [];

            if (productData.name !== undefined) {
                updates.push('name = ?');
                values.push(productData.name);
            }
            if (productData.description !== undefined) {
                updates.push('description = ?');
                values.push(productData.description);
            }
            if (productData.price !== undefined) {
                updates.push('price = ?');
                values.push(productData.price);
            }
            if (productData.brand_id !== undefined) {
                updates.push('brand_id = ?');
                values.push(productData.brand_id);
            }
            if (productData.category_id !== undefined) {
                updates.push('category_id = ?');
                values.push(productData.category_id);
            }
            if (productData.image_url !== undefined) {
                updates.push('image_url = ?');
                values.push(productData.image_url);
            }
            if (productData.stock !== undefined) {
                updates.push('stock = ?');
                values.push(productData.stock);
            }

            // Nếu không có trường nào cần cập nhật thì bỏ qua, tránh lỗi SQL
            if (updates.length === 0) {
                return false;
            }

            values.push(id);

            const [result] = await connection.execute(
                `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
                values
            );
            return result.affectedRows > 0;
        } finally {
            connection.release();
        }
    }

    // Xóa sản phẩm
    static async delete(id) {
        const connection = await getConnection();
        try {
            const [result] = await connection.execute(
                'DELETE FROM products WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } finally {
            connection.release();
        }
    }
}

module.exports = Product;

