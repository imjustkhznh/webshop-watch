const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function checkCitizenProducts() {
    try {
        // Kết nối database
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'watchshop_db'
        });

        console.log('✅ Connected to database successfully!');

        // Kiểm tra bảng categories
        console.log('\n📋 Categories in database:');
        console.log('='.repeat(50));
        const [categories] = await connection.execute('SELECT * FROM categories');
        categories.forEach(cat => {
            console.log(`ID: ${cat.id} - Name: ${cat.name}`);
        });

        // Kiểm tra brands
        console.log('\n📋 Brands in database:');
        console.log('='.repeat(50));
        const [brands] = await connection.execute('SELECT * FROM brands');
        brands.forEach(brand => {
            console.log(`ID: ${brand.id} - Name: ${brand.name || 'N/A'}`);
        });

        // Kiểm tra tất cả sản phẩm Citizen
        console.log('\n📊 All Citizen products:');
        console.log('='.repeat(80));
        const [citizenProducts] = await connection.execute(`
            SELECT p.*, b.name as brand_name, c.name as category_name
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE b.name = 'Citizen'
            ORDER BY p.id
        `);
        
        citizenProducts.forEach((product, index) => {
            console.log(`${index + 1}. ID: ${product.id}`);
            console.log(`   Name: ${product.name}`);
            console.log(`   Brand: ${product.brand_name}`);
            console.log(`   Category: ${product.category_name}`);
            console.log(`   Price: ${product.price}`);
            console.log(`   Stock: ${product.stock}`);
            console.log('   ' + '-'.repeat(40));
        });

        // Kiểm tra sản phẩm Citizen với category "đeo tay"
        console.log('\n📊 Citizen products with "đeo tay" category:');
        console.log('='.repeat(80));
        const [citizenWatches] = await connection.execute(`
            SELECT p.*, b.name as brand_name, c.name as category_name
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE b.name = 'Citizen' AND c.name = 'Đồng hồ đeo tay'
            ORDER BY p.id
        `);
        
        citizenWatches.forEach((product, index) => {
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
        console.error('❌ Error checking Citizen products:', error);
    }
}

checkCitizenProducts(); 