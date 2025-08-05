const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

const createConnection = async () => {
    return await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'timeluxe_db'
    });
};

const checkCustomers = async () => {
    const connection = await createConnection();
    try {
        console.log('🔍 Checking customers data...\n');
        
        // Check table structure
        const [columns] = await connection.execute('DESCRIBE users');
        console.log('📋 Users table structure:');
        columns.forEach(col => {
            console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'}`);
        });
        console.log('');
        
        // Check customers data
        const [customers] = await connection.execute(`
            SELECT id, username, email, full_name, role, created_at
            FROM users
            WHERE role = 'customer'
            ORDER BY created_at DESC
        `);
        
        console.log('👥 Customers data:');
        if (customers.length === 0) {
            console.log('  No customers found!');
        } else {
            customers.forEach(customer => {
                console.log(`  - ID: ${customer.id}`);
                console.log(`    Username: ${customer.username}`);
                console.log(`    Email: ${customer.email}`);
                console.log(`    Full Name: "${customer.full_name}" (${customer.full_name ? 'NOT NULL' : 'NULL'})`);
                console.log(`    Role: ${customer.role}`);
                console.log(`    Created: ${customer.created_at}`);
                console.log('');
            });
        }
        
        // Check total count
        const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM users WHERE role = "customer"');
        console.log(`📊 Total customers: ${countResult[0].total}`);
        
    } catch (error) {
        console.error('❌ Error checking customers:', error);
    } finally {
        await connection.end();
    }
};

checkCustomers().catch(console.error); 