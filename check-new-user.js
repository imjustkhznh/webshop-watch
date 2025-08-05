const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function checkNewUser() {
    try {
        // Kết nối database
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'watchshop_db'
        });

        console.log('✅ Connected to database successfully!');

        // Lấy tất cả users từ bảng users
        const [users] = await connection.execute('SELECT * FROM users ORDER BY id DESC LIMIT 10');
        
        console.log('\n📊 Latest 10 users in database:');
        console.log('='.repeat(80));
        
        users.forEach((user, index) => {
            console.log(`${index + 1}. ID: ${user.id}`);
            console.log(`   Username: ${user.username}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Full Name: ${user.full_name}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Phone: ${user.phone || 'N/A'}`);
            console.log(`   Address: ${user.address || 'N/A'}`);
            console.log(`   Created: ${user.created_at}`);
            console.log('   ' + '-'.repeat(40));
        });

        // Đếm tổng số users theo role
        const [roleCounts] = await connection.execute(`
            SELECT role, COUNT(*) as count 
            FROM users 
            GROUP BY role
        `);
        
        console.log('\n📈 Database Statistics:');
        console.log('='.repeat(80));
        roleCounts.forEach(role => {
            console.log(`${role.role}: ${role.count} users`);
        });

        const [totalCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
        console.log(`Total Users: ${totalCount[0].count}`);

        await connection.end();
        console.log('\n✅ Database connection closed successfully!');

    } catch (error) {
        console.error('❌ Error checking new user:', error);
    }
}

checkNewUser(); 