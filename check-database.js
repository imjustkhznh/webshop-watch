const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function checkDatabase() {
    try {
        // Kết nối database
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'watchshop_db'
        });

        console.log('✅ Connected to database successfully!');

        // Kiểm tra tất cả tables trong database
        const [tables] = await connection.execute('SHOW TABLES');
        
        console.log('\n📊 All tables in database:');
        console.log('='.repeat(80));
        
        tables.forEach((table, index) => {
            const tableName = Object.values(table)[0];
            console.log(`${index + 1}. ${tableName}`);
        });

        // Kiểm tra từng table
        for (const table of tables) {
            const tableName = Object.values(table)[0];
            console.log(`\n📋 Structure of table: ${tableName}`);
            console.log('-'.repeat(50));
            
            try {
                const [columns] = await connection.execute(`DESCRIBE ${tableName}`);
                columns.forEach(column => {
                    console.log(`   ${column.Field} - ${column.Type} - ${column.Null} - ${column.Key} - ${column.Default}`);
                });
                
                // Đếm số records
                const [count] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
                console.log(`   Total records: ${count[0].count}`);
                
            } catch (error) {
                console.log(`   Error checking table ${tableName}: ${error.message}`);
            }
        }

        await connection.end();
        console.log('\n✅ Database connection closed successfully!');

    } catch (error) {
        console.error('❌ Error checking database:', error);
    }
}

checkDatabase(); 