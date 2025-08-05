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

const checkPasswords = async () => {
    const connection = await createConnection();
    
    try {
        console.log('🔍 Checking all users and their passwords...\n');
        
        // Get all users
        const [users] = await connection.execute('SELECT id, username, email, password, role FROM users');
        
        for (const user of users) {
            console.log(`👤 User: ${user.username} (${user.email})`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Password hash: ${user.password.substring(0, 30)}...`);
            
            // Test common passwords
            const testPasswords = ['123456', 'password', 'admin123', '123456789', 'qwerty'];
            let foundPassword = null;
            
            for (const testPassword of testPasswords) {
                const isValid = await bcrypt.compare(testPassword, user.password);
                if (isValid) {
                    foundPassword = testPassword;
                    break;
                }
            }
            
            if (foundPassword) {
                console.log(`   ✅ Password found: ${foundPassword}`);
            } else {
                console.log(`   ❌ Password not found in common list`);
            }
            console.log('');
        }
        
        console.log('📋 Summary of working credentials:');
        console.log('=====================================');
        
        for (const user of users) {
            const testPasswords = ['123456', 'password', 'admin123', '123456789', 'qwerty'];
            let foundPassword = null;
            
            for (const testPassword of testPasswords) {
                const isValid = await bcrypt.compare(testPassword, user.password);
                if (isValid) {
                    foundPassword = testPassword;
                    break;
                }
            }
            
            if (foundPassword) {
                console.log(`✅ ${user.email} / ${foundPassword} (${user.role})`);
            } else {
                console.log(`❌ ${user.email} - Password unknown`);
            }
        }
        
    } catch (error) {
        console.error('❌ Error checking passwords:', error.message);
    } finally {
        await connection.end();
    }
};

checkPasswords(); 