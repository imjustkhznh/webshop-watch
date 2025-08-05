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

const syncProducts = async () => {
    const connection = await createConnection();
    
    try {
        // Lấy tất cả sản phẩm với thông tin brand và category
        const [products] = await connection.execute(`
            SELECT 
                p.id,
                p.name,
                p.price,
                p.stock,
                p.description,
                p.image,
                b.name as brand_name,
                c.name as category_name,
                p.created_at
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN categories c ON p.category_id = c.id
            ORDER BY p.id DESC
        `);

        console.log('\n📊 DANH SÁCH SẢN PHẨM HIỆN TẠI:');
        console.log('=' .repeat(80));
        
        products.forEach((product, index) => {
            const status = product.stock > 0 ? '🟢 Còn hàng' : '🔴 Hết hàng';
            const stockStatus = product.stock > 10 ? '🟢' : product.stock > 5 ? '🟡' : '🔴';
            
            console.log(`${index + 1}. ${product.name}`);
            console.log(`   📦 Mã: SP${String(product.id).padStart(3, '0')}`);
            console.log(`   🏷️  Thương hiệu: ${product.brand_name}`);
            console.log(`   📂 Loại: ${product.category_name}`);
            console.log(`   💰 Giá: ${product.price.toLocaleString('vi-VN')} ₫`);
            console.log(`   📦 Tồn kho: ${stockStatus} ${product.stock} cái`);
            console.log(`   📊 Trạng thái: ${status}`);
            console.log(`   📅 Tạo: ${new Date(product.created_at).toLocaleDateString('vi-VN')}`);
            console.log('─'.repeat(80));
        });

        console.log(`\n📈 TỔNG KẾT:`);
        console.log(`   • Tổng sản phẩm: ${products.length}`);
        console.log(`   • Còn hàng: ${products.filter(p => p.stock > 0).length}`);
        console.log(`   • Hết hàng: ${products.filter(p => p.stock === 0).length}`);
        console.log(`   • Tổng giá trị: ${products.reduce((sum, p) => sum + (p.price * p.stock), 0).toLocaleString('vi-VN')} ₫`);

        // Kiểm tra sự khác biệt giữa các lần truy cập
        console.log(`\n🔍 PHÂN TÍCH:`);
        const brands = [...new Set(products.map(p => p.brand_name))];
        const categories = [...new Set(products.map(p => p.category_name))];
        
        console.log(`   • Thương hiệu: ${brands.join(', ')}`);
        console.log(`   • Loại sản phẩm: ${categories.join(', ')}`);
        
        // Kiểm tra sản phẩm có thể bị thiếu
        const expectedProducts = [
            'Casio G-Shock GA-2100',
            'Seiko Presage SRPB43', 
            'Citizen Eco-Drive BM8180',
            'Orient Bambino V4',
            'Tissot T-Classic',
            'Seiko SKX007',
            'Casio Edifice EFV-100D',
            'Citizen Promaster NY0040'
        ];

        const missingProducts = expectedProducts.filter(expected => 
            !products.some(p => p.name.includes(expected.split(' ')[0]))
        );

        if (missingProducts.length > 0) {
            console.log(`\n⚠️  SẢN PHẨM CÓ THỂ BỊ THIẾU:`);
            missingProducts.forEach(product => console.log(`   • ${product}`));
        }

    } catch (error) {
        console.error('❌ Error syncing products:', error);
    } finally {
        await connection.end();
    }
};

// Chạy sync
syncProducts().catch(console.error); 