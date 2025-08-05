const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function checkOrientProducts() {
    try {
        // Kết nối database
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'watchshop_db'
        });

        console.log('✅ Connected to database successfully!');

        // Kiểm tra tất cả sản phẩm Orient
        console.log('\n📊 All Orient products:');
        console.log('='.repeat(80));
        const [orientProducts] = await connection.execute(`
            SELECT p.*, b.name as brand_name, c.name as category_name
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE b.name = 'Orient'
            ORDER BY p.id
        `);
        
        orientProducts.forEach((product, index) => {
            console.log(`${index + 1}. ID: ${product.id}`);
            console.log(`   Name: ${product.name}`);
            console.log(`   Brand: ${product.brand_name}`);
            console.log(`   Category: ${product.category_name}`);
            console.log(`   Price: ${product.price}`);
            console.log(`   Stock: ${product.stock}`);
            console.log('   ' + '-'.repeat(40));
        });

        // Kiểm tra sản phẩm Orient với category "đeo tay"
        console.log('\n📊 Orient products with "đeo tay" category:');
        console.log('='.repeat(80));
        const [orientWatches] = await connection.execute(`
            SELECT p.*, b.name as brand_name, c.name as category_name
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE b.name = 'Orient' AND c.name = 'Đeo tay'
            ORDER BY p.id
        `);
        
        orientWatches.forEach((product, index) => {
            console.log(`${index + 1}. ID: ${product.id}`);
            console.log(`   Name: ${product.name}`);
            console.log(`   Brand: ${product.brand_name}`);
            console.log(`   Category: ${product.category_name}`);
            console.log(`   Price: ${product.price}`);
            console.log(`   Stock: ${product.stock}`);
            console.log('   ' + '-'.repeat(40));
        });

        await connection.end();
        console.log('\n✅ Database connection closed successfully!');

    } catch (error) {
        console.error('❌ Error checking Orient products:', error);
    }
}

checkOrientProducts(); 