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

const seedData = async () => {
    const connection = await createConnection();
    
    try {
        // Sample brands data
        const brands = [
            { name: 'Casio' },
            { name: 'Seiko' },
            { name: 'Citizen' },
            { name: 'Orient' },
            { name: 'Tissot' },
            { name: 'Omega' },
            { name: 'Rolex' },
            { name: 'Swatch' }
        ];

        // Insert brands
        for (const brand of brands) {
            await connection.execute(
                'INSERT INTO brands (name) VALUES (?)',
                [brand.name]
            );
        }
        console.log('✅ Sample brands added successfully!');

        // Sample categories data
        const categories = [
            { name: 'Thể thao' },
            { name: 'Cơ khí' },
            { name: 'Quân đội' },
            { name: 'Cổ điển' },
            { name: 'Luxury' },
            { name: 'Smart Watch' },
            { name: 'Dress Watch' },
            { name: 'Diving' }
        ];

        // Insert categories
        for (const category of categories) {
            await connection.execute(
                'INSERT INTO categories (name) VALUES (?)',
                [category.name]
            );
        }
        console.log('✅ Sample categories added successfully!');

        // Sample products data
        const products = [
            {
                name: 'Casio G-Shock GA-2100',
                brand_id: 1, // Casio
                category_id: 1, // Thể thao
                price: 2500000,
                description: 'Đồng hồ thể thao chống sốc với thiết kế hiện đại, chống nước 200m',
                image: 'static/dongho1.webp',
                stock: 15
            },
            {
                name: 'Seiko Presage SRPB43',
                brand_id: 2, // Seiko
                category_id: 2, // Cơ khí
                price: 8500000,
                description: 'Đồng hồ cơ tự động với mặt số xanh dương sang trọng, máy 4R35',
                image: 'static/dongho2.webp',
                stock: 8
            },
            {
                name: 'Citizen Eco-Drive BM8180',
                brand_id: 3, // Citizen
                category_id: 3, // Quân đội
                price: 3200000,
                description: 'Đồng hồ năng lượng ánh sáng với thiết kế quân đội, chống nước 100m',
                image: 'static/dongho3.webp',
                stock: 12
            },
            {
                name: 'Orient Bambino V4',
                brand_id: 4, // Orient
                category_id: 4, // Cổ điển
                price: 4200000,
                description: 'Đồng hồ cơ khí cổ điển với thiết kế dress watch, máy F6724',
                image: 'static/dongho4.webp',
                stock: 10
            },
            {
                name: 'Tissot T-Classic',
                brand_id: 5, // Tissot
                category_id: 5, // Luxury
                price: 12000000,
                description: 'Đồng hồ Thụy Sĩ với độ chính xác cao, máy ETA 2824-2',
                image: 'static/dongho5.webp',
                stock: 5
            },
            {
                name: 'Seiko SKX007',
                brand_id: 2, // Seiko
                category_id: 8, // Diving
                price: 6800000,
                description: 'Đồng hồ lặn chuyên nghiệp, chống nước 200m, bezel xoay một chiều',
                image: 'static/dongho1.webp',
                stock: 7
            },
            {
                name: 'Casio Edifice EFV-100D',
                brand_id: 1, // Casio
                category_id: 7, // Dress Watch
                price: 1800000,
                description: 'Đồng hồ điện tử thể thao với thiết kế thanh lịch, chống nước 100m',
                image: 'static/dongho2.webp',
                stock: 20
            },
            {
                name: 'Citizen Promaster NY0040',
                brand_id: 3, // Citizen
                category_id: 8, // Diving
                price: 4500000,
                description: 'Đồng hồ lặn chuyên nghiệp với máy cơ tự động, chống nước 200m',
                image: 'static/dongho3.webp',
                stock: 6
            },
            // Sản phẩm phụ kiện (category_id = 4)
            {
                name: 'Hộp Đựng Đồng Hồ 6 Ngăn',
                brand_id: 1, // Casio
                category_id: 4, // Khác
                price: 800000,
                description: 'Chất liệu gỗ cao cấp, lót nhung, bảo vệ đồng hồ khỏi bụi và va đập',
                image: 'static/dongho1.webp',
                stock: 15
            },
            {
                name: 'Bộ Dụng Cụ Thay Dây',
                brand_id: 2, // Seiko
                category_id: 4, // Khác
                price: 150000,
                description: 'Bao gồm dụng cụ tháo chốt, thay dây, phù hợp mọi loại đồng hồ',
                image: 'static/dongho2.webp',
                stock: 25
            },
            {
                name: 'Khăn Lau Đồng Hồ',
                brand_id: 3, // Citizen
                category_id: 4, // Khác
                price: 50000,
                description: 'Sợi microfiber mềm mại, không xước mặt kính, làm sạch hiệu quả',
                image: 'static/dongho3.webp',
                stock: 30
            },
            {
                name: 'Giá Đỡ Đồng Hồ Acrylic',
                brand_id: 4, // Orient
                category_id: 4, // Khác
                price: 120000,
                description: 'Chất liệu acrylic trong suốt, trưng bày đồng hồ đẹp mắt, chắc chắn',
                image: 'static/dongho4.webp',
                stock: 20
            },
            {
                name: 'Pin Đồng Hồ Maxell SR626SW',
                brand_id: 5, // Tissot
                category_id: 4, // Khác
                price: 35000,
                description: 'Pin chính hãng Maxell, dùng cho nhiều loại đồng hồ quartz, bền bỉ',
                image: 'static/dongho5.webp',
                stock: 50
            }
        ];

        // Insert products
        for (const product of products) {
            await connection.execute(`
                INSERT INTO products (name, brand_id, category_id, price, description, image, stock)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                product.name,
                product.brand_id,
                product.category_id,
                product.price,
                product.description,
                product.image,
                product.stock
            ]);
        }

        console.log('✅ Sample products added successfully!');

        // Sample users (passwords are hashed)
        const bcrypt = require('bcryptjs');
        
        // Hash passwords
        const adminPassword = await bcrypt.hash('admin123', 10);
        const customerPassword = await bcrypt.hash('123456', 10);
        
        // Check if users already exist
        const [existingUsers] = await connection.execute('SELECT username FROM users');
        const existingUsernames = existingUsers.map(u => u.username);
        
        if (!existingUsernames.includes('admin')) {
            await connection.execute(`
                INSERT INTO users (username, password, email, full_name, role)
                VALUES (?, ?, ?, ?, ?)
            `, [
                'admin',
                adminPassword,
                'admin@shop.com',
                'Quản Trị Viên',
                'admin'
            ]);
            console.log('✅ Admin user added successfully!');
        }



        if (!existingUsernames.includes('khanh123')) {
            await connection.execute(`
                INSERT INTO users (username, password, email, full_name, role)
                VALUES (?, ?, ?, ?, ?)
            `, [
                'khanh123',
                customerPassword,
                'khanh@gmail.com',
                'Phạm Gia Khánh',
                'customer'
            ]);
            console.log('✅ Customer user added successfully!');
        }

        console.log('\n📋 Sample Login Credentials:');
        console.log('👤 Admin - Email: admin@shop.com, Password: admin123');
        console.log('👤 Customer - Email: khanh@gmail.com, Password: 123456');

    } catch (error) {
        console.error('❌ Error seeding data:', error.message);
    } finally {
        await connection.end();
    }
};

// Run the seed function
seedData(); 