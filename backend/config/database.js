const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

// Tạo connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 3,
    queueLimit: 0
});


// Hàm lấy connection từ pool (luôn nhớ release sau khi dùng!)
const getConnection = async () => {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('✅ Got connection from pool!');
        return connection;
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        if (connection) {
            try { connection.release(); } catch (e) {}
        }
        if (error.code === 'ER_CON_COUNT_ERROR' || error.code === 'ER_USER_LIMIT_REACHED') {
            console.error('⚠️ Too many connections. Waiting 5 seconds before retry...');
            await new Promise(resolve => setTimeout(resolve, 5000));
            return await pool.getConnection();
        }
        throw error;
    }
};

// Gợi ý: Nên dùng pool.query(sql, params) thay vì getConnection để tự động giải phóng connection!

module.exports = { pool, getConnection };

