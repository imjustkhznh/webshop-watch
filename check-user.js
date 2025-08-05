const mysql = require('mysql2/promise');
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

const checkUser = async () => {
    const connection = await createConnection();
    
    try {
        console.log('Checking users in database...');
        
        // Check all users
        const [users] = await connection.execute('SELECT id, username, email, role FROM users');
        console.log('All users in database:');
        users.forEach(user => {
            console.log(`- ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, Role: ${user.role}`);
        });
        
        // Check specific user
        const [specificUser] = await connection.execute(
            'SELECT * FROM users WHERE email = ? OR username = ?',
            ['khanh@gmail.com', 'khanh@gmail.com']
        );
        
        if (specificUser.length > 0) {
            console.log('\n✅ User found:');
            console.log(`- ID: ${specificUser[0].id}`);
            console.log(`- Username: ${specificUser[0].username}`);
            console.log(`- Email: ${specificUser[0].email}`);
            console.log(`- Role: ${specificUser[0].role}`);
            console.log(`- Password hash: ${specificUser[0].password.substring(0, 20)}...`);
        } else {
            console.log('\n❌ User not found!');
        }
        
    } catch (error) {
        console.error('❌ Error checking user:', error.message);
    } finally {
        await connection.end();
    }
};

checkUser(); 