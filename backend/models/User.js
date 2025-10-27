const { getConnection } = require('../config/database');

class User {
    // Lấy user theo email hoặc username
    static async findByEmailOrUsername(identifier) {
        const connection = await getConnection();
        try {
            const [users] = await connection.execute(
                'SELECT * FROM users WHERE email = ? OR username = ?',
                [identifier, identifier]
            );
            return users[0];
        } finally {
            connection.release();
        }
    }

    // Lấy user theo ID
    static async findById(id) {
        const connection = await getConnection();
        try {
            const [users] = await connection.execute(
                'SELECT * FROM users WHERE id = ?',
                [id]
            );
            return users[0];
        } finally {
            connection.release();
        }
    }

    // Tạo user mới
    static async create(userData) {
        const connection = await getConnection();
        try {
            const [result] = await connection.execute(
                `INSERT INTO users (username, email, password, full_name, phone, address, role) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    userData.username,
                    userData.email,
                    userData.password,
                    userData.full_name,
                    userData.phone || null,
                    userData.address || null,
                    userData.role || 'customer'
                ]
            );
            return result.insertId;
        } finally {
            connection.release();
        }
    }

    // Cập nhật thông tin user
    static async update(id, userData) {
        const connection = await getConnection();
        try {
            const updates = [];
            const values = [];

            if (userData.full_name !== undefined) {
                updates.push('full_name = ?');
                values.push(userData.full_name);
            }
            if (userData.phone !== undefined) {
                updates.push('phone = ?');
                values.push(userData.phone);
            }
            if (userData.address !== undefined) {
                updates.push('address = ?');
                values.push(userData.address);
            }
            if (userData.date_of_birth !== undefined) {
                updates.push('date_of_birth = ?');
                values.push(userData.date_of_birth);
            }
            if (userData.gender !== undefined) {
                updates.push('gender = ?');
                values.push(userData.gender);
            }
            if (userData.avatar !== undefined) {
                updates.push('avatar = ?');
                values.push(userData.avatar);
            }
            if (userData.password !== undefined) {
                updates.push('password = ?');
                values.push(userData.password);
            }

            if (updates.length === 0) {
                return false;
            }

            values.push(id);

            const [result] = await connection.execute(
                `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
                values
            );
            return result.affectedRows > 0;
        } finally {
            connection.release();
        }
    }

    // Xóa user
    static async delete(id) {
        const connection = await getConnection();
        try {
            await connection.beginTransaction();

            // Delete related records first
            await connection.execute('DELETE FROM order_details WHERE order_id IN (SELECT id FROM orders WHERE user_id = ?)', [id]);
            await connection.execute('DELETE FROM orders WHERE user_id = ?', [id]);
            await connection.execute('DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE user_id = ?)', [id]);
            await connection.execute('DELETE FROM carts WHERE user_id = ?', [id]);
            await connection.execute('DELETE FROM reviews WHERE user_id = ?', [id]);
            await connection.execute('DELETE FROM users WHERE id = ?', [id]);

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Lấy tất cả customers
    static async getAllCustomers() {
        const connection = await getConnection();
        try {
            const [customers] = await connection.execute(`
                SELECT id, 
                       COALESCE(full_name, 'N/A') as name, 
                       email, 
                       COALESCE(phone, 'N/A') as phone, 
                       COALESCE(address, 'N/A') as address, 
                       created_at,
                       (SELECT COUNT(*) FROM orders WHERE user_id = users.id) as order_count
                FROM users
                WHERE role = 'customer'
                ORDER BY created_at DESC
            `);
            return customers;
        } finally {
            connection.release();
        }
    }
}

module.exports = User;

