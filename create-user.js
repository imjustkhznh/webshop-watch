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

const createUser = async () => {
    const connection = await createConnection();
    
    try {
        // Hash password
        const hashedPassword = await bcrypt.hash('123456', 10);
        
        // Check if user already exists
        const [existingUsers] = await connection.execute(
            'SELECT id FROM users WHERE email = ? OR username = ?',
            ['khanh@gmail.com', 'khanh@gmail.com']
        );
        
        if (existingUsers.length > 0) {
            console.log('❌ User already exists!');
            return;
        }
        
        // Create new user
        await connection.execute(`
            INSERT INTO users (username, email, password, full_name, role) 
            VALUES (?, ?, ?, ?, ?)
        `, [
            'khanh@gmail.com',  // username
            'khanh@gmail.com',  // email
            hashedPassword,      // password
            'Phạm Gia Khánh',   // full_name
            'customer'           // role
        ]);
        
        console.log('✅ User created successfully!');
        console.log('📧 Email: khanh@gmail.com');
        console.log('🔑 Password: 123456');
        console.log('👤 Role: customer');
        
    } catch (error) {
        console.error('❌ Error creating user:', error.message);
    } finally {
        await connection.end();
    }
};

createUser(); 