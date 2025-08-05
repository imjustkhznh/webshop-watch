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

const testRegistration = async () => {
    const connection = await createConnection();
    
    try {
        console.log('🧪 Testing registration process...\n');
        
        // Test data
        const testUser = {
            username: 'testregister',
            email: 'testregister@gmail.com',
            password: '123456',
            full_name: 'Test Register User'
        };
        
        console.log('📝 Test user data:');
        console.log(`   Username: ${testUser.username}`);
        console.log(`   Email: ${testUser.email}`);
        console.log(`   Password: ${testUser.password}`);
        console.log(`   Full Name: ${testUser.full_name}\n`);
        
        // Check if user already exists
        const [existingUsers] = await connection.execute(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [testUser.username, testUser.email]
        );
        
        if (existingUsers.length > 0) {
            console.log('❌ User already exists! Deleting old user...');
            await connection.execute(
                'DELETE FROM users WHERE username = ? OR email = ?',
                [testUser.username, testUser.email]
            );
        }
        
        // Hash password (same as registration)
        const hashedPassword = await bcrypt.hash(testUser.password, 10);
        console.log('🔐 Password hashed successfully');
        console.log(`   Hash: ${hashedPassword.substring(0, 30)}...\n`);
        
        // Insert new user (same as registration API)
        const [result] = await connection.execute(
            'INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)',
            [testUser.username, testUser.email, hashedPassword, testUser.full_name, 'customer']
        );
        
        console.log('✅ User registered successfully!');
        console.log(`   User ID: ${result.insertId}\n`);
        
        // Verify the user was created correctly
        const [newUser] = await connection.execute(
            'SELECT * FROM users WHERE id = ?',
            [result.insertId]
        );
        
        if (newUser.length > 0) {
            const user = newUser[0];
            console.log('🔍 Verification:');
            console.log(`   ID: ${user.id}`);
            console.log(`   Username: ${user.username}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Full Name: ${user.full_name}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Password Hash: ${user.password.substring(0, 30)}...\n`);
            
            // Test password verification
            const isValidPassword = await bcrypt.compare(testUser.password, user.password);
            console.log(`🔐 Password verification: ${isValidPassword ? '✅ SUCCESS' : '❌ FAILED'}`);
            
            if (isValidPassword) {
                console.log('🎉 Registration process is working correctly!');
                console.log('📧 You can now login with:');
                console.log(`   Email: ${testUser.email}`);
                console.log(`   Password: ${testUser.password}`);
            } else {
                console.log('❌ Password verification failed!');
            }
        }
        
    } catch (error) {
        console.error('❌ Error testing registration:', error.message);
    } finally {
        await connection.end();
    }
};

testRegistration(); 