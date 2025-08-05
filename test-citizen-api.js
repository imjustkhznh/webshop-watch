const fetch = require('node-fetch');

async function testCitizenAPI() {
    try {
        console.log('🔍 Testing Citizen API...');
        
        const response = await fetch('http://localhost:3000/api/products');
        const data = await response.json();
        
        console.log('✅ API Response received');
        console.log(`Total products: ${data.products ? data.products.length : 0}`);
        
        // Lọc sản phẩm Citizen
        const citizenProducts = (data.products || []).filter(p => p.brand_name === 'Citizen');
        console.log(`\n📊 Citizen products: ${citizenProducts.length}`);
        citizenProducts.forEach((product, index) => {
            console.log(`${index + 1}. ${product.name} - ${product.brand_name} - ${product.category_name}`);
        });
        
        // Lọc sản phẩm Citizen đeo tay
        const citizenWatches = citizenProducts.filter(p => p.category_name === 'Đeo tay');
        console.log(`\n📊 Citizen watches (đeo tay): ${citizenWatches.length}`);
        citizenWatches.forEach((product, index) => {
            console.log(`${index + 1}. ${product.name} - ${product.price}đ`);
        });
        
    } catch (error) {
        console.error('❌ Error testing API:', error);
    }
}

testCitizenAPI(); 