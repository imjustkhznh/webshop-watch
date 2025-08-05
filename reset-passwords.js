const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './config.env' });

const createConnection = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        console.log('✅ Connected to database successfully!');
        return connection;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        throw error;
    }
};

const resetPasswords = async () => {
    const connection = await createConnection();
    
    try {
        console.log('🔧 Resetting passwords for all users...\n');
        
        // Hash the new password
        const newPassword = '123456';
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Get all users except admin (keep admin password as admin123)
        const [users] = await connection.execute(
            'SELECT id, username, email, role FROM users WHERE role != "admin"'
        );
        
        for (const user of users) {
            console.log(`🔄 Resetting password for: ${user.email} (${user.role})`);
            
            await connection.execute(
                'UPDATE users SET password = ? WHERE id = ?',
                [hashedPassword, user.id]
            );
            
            console.log(`   ✅ Password reset to: ${newPassword}`);
        }
        
        console.log('\n📋 All passwords have been reset to: 123456');
        console.log('=====================================');
        console.log('✅ admin@shop.com / admin123 (admin)');
        
        for (const user of users) {
            console.log(`✅ ${user.email} / 123456 (${user.role})`);
        }
        
    } catch (error) {
        console.error('❌ Error resetting passwords:', error.message);
    } finally {
        await connection.end();
    }
};

resetPasswords(); 