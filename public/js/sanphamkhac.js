// Custom Notification Function
function showNotification(message, type = 'success', duration = 3000) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.custom-notification');
    existingNotifications.forEach(notification => {
        notification.remove();
    });
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `custom-notification ${type}`;
    
    // Set icon based on type
    let icon = 'fas fa-check-circle';
    switch(type) {
        case 'error':
            icon = 'fas fa-exclamation-circle';
            break;
        case 'warning':
            icon = 'fas fa-exclamation-triangle';
            break;
        case 'info':
            icon = 'fas fa-info-circle';
            break;
        default:
            icon = 'fas fa-check-circle';
    }
    
    notification.innerHTML = `
        <div class="notification-content">
            <i class="${icon} notification-icon"></i>
            <span class="notification-text">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show notification with animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Auto remove after duration
    if (duration > 0) {
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 400);
        }, duration);
    }
}

// Fetch dữ liệu sản phẩm loại "Khác" từ API
// Yêu cầu: chỉ hiển thị sản phẩm có cả thương hiệu là "Khác" và loại sản phẩm là "Khác"
function normalizeString(str) {
    if (!str || typeof str !== 'string') return '';
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

async function loadAccessoryProducts() {
    try {
        console.log('🔍 Fetching all products to filter brand/category = Khác...');
        const response = await fetch('/api/products');
        console.log('📡 Response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('📦 API response data:', data);

        const products = Array.isArray(data.products) ? data.products : [];

        // Filter where both brand and category are 'Khác' (normalize, ignore diacritics)
        const khacProducts = products.filter(p => {
            const brand = normalizeString(p.brand_name || p.brand || '');
            const category = normalizeString(p.category_name || p.category || '');
            return brand.includes('khac') && category.includes('khac');
        });

        console.log(`🎯 Filtered to ${khacProducts.length} products where brand & category = Khác`);

        if (khacProducts.length > 0) {
            allAccessoryProducts = khacProducts;
            renderAccessoryProducts(khacProducts);
        } else {
            allAccessoryProducts = [];
            const grid = document.getElementById('sanphamkhac-grid');
            if (grid) {
                grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#888;font-size:1.2rem;">Không có sản phẩm nào có cả thương hiệu và loại là "Khác". Vui lòng kiểm tra dữ liệu hoặc thêm sản phẩm qua trang Admin.</div>';
            }
        }
    } catch (error) {
        console.error('❌ Error fetching accessory products:', error);
        const grid = document.getElementById('sanphamkhac-grid');
        if (grid) {
            grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#888;font-size:1.2rem;">Không thể tải dữ liệu sản phẩm. Vui lòng thử lại sau.</div>';
        }
    }
}

// Add to cart function
function addToCart(productId, productName, productPrice, productImage) {
    console.log('addToCart called with:', { productId, productName, productPrice, productImage });
    try {
        let cart = getCart();
        const idx = cart.findIndex(item => item.id === productId);
        
        if (idx !== -1) {
            cart[idx].quantity += 1;
        } else {
            cart.push({ id: productId, name: productName, price: productPrice, image: productImage, quantity: 1 });
        }
        setCart(cart);
        updateCartCount();
        console.log('About to show notification');
        showNotification('Đã thêm vào giỏ hàng!', 'success');
        console.log('Notification should be shown');
    } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification('Có lỗi xảy ra khi thêm vào giỏ hàng!', 'error');
    }
}

// Hiển thị sản phẩm
function renderAccessoryProducts(products) {
    const grid = document.getElementById('sanphamkhac-grid');
    if (!grid) {
        console.log('❌ Products grid not found');
        return;
    }
    
    console.log(`🎨 Displaying ${products.length} products in category "Khác":`);
    products.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} - ${Number(product.price).toLocaleString('vi-VN')}đ`);
    });
    
    grid.innerHTML = '';
    
    if (products.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#888;font-size:1.2rem;">Không có sản phẩm nào thuộc loại "Khác".</div>';
        return;
    }
    
    products.forEach(product => {
        let discount = Number(product.discount) || 0;
        let originalPrice = Number(product.original_price) || Number(product.price);
        let salePrice = Number(product.price);
        if (discount > 0) {
            salePrice = Math.round(originalPrice * (1 - discount / 100));
        }
        const imageUrl = resolveImagePath(product.image || product.image_url || (product.images && product.images[0]));
        
        // Check if product is in wishlist
        const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        const isInWishlist = wishlist.some(item => item.id === product.id);
        
        grid.innerHTML += `
        <div class="product-card">
            <div class="product-image">
                <img src="${imageUrl}" alt="${product.name}" />
                <button class="wishlist-btn ${isInWishlist ? 'active' : ''}" onclick="toggleWishlist(${product.id}, '${product.name.replace(/'/g, "\\'")}', ${salePrice}, '${imageUrl}')">
                    <i class="fas fa-heart"></i>
                </button>
                ${discount > 0 ? `<span class='discount-badge'>-${discount}%</span>` : ''}
            </div>
            <div class="product-info">
                <h4 class="product-name">${product.name}</h4>
                <div class="price-group">
                    ${discount > 0 ? `<span class='old-price'>${originalPrice.toLocaleString('vi-VN', {style:'currency',currency:'VND'})}</span>` : ''}
                    <span class="sale-price">${salePrice.toLocaleString('vi-VN', {style:'currency',currency:'VND'})}</span>
                </div>
                <div class="button-group">
                    <button class="add-to-cart" onclick="addToCart(${product.id}, '${product.name.replace(/'/g, "\\'")}', ${salePrice}, '${imageUrl}')">Thêm vào giỏ</button>
                    <a href="product.html?id=${product.id}" class="btn-detail">Xem chi tiết</a>
                </div>
            </div>
        </div>
        `;
    });
    
    console.log(`✅ Successfully displayed ${products.length} products`);
}

// Lọc sản phẩm theo danh mục
function filterProducts(category, allProducts) {
    let filteredProducts = allProducts;
    
    if (category === 'Phụ kiện') {
        filteredProducts = allProducts.filter(p => 
            p.name.includes('Dây') || p.name.includes('Pin') || p.name.includes('Khăn')
        );
    } else if (category === 'Hộp đựng') {
        filteredProducts = allProducts.filter(p => 
            p.name.includes('Hộp') || p.name.includes('Giá')
        );
    } else if (category === 'Dụng cụ') {
        filteredProducts = allProducts.filter(p => 
            p.name.includes('Dụng') || p.name.includes('Bộ')
        );
    }
    
    renderAccessoryProducts(filteredProducts);
}

// Xử lý tìm kiếm
function searchProducts(query, allProducts) {
    const filtered = allProducts.filter(product => 
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase())
    );
    renderAccessoryProducts(filtered);
}

// Biến lưu trữ tất cả sản phẩm
let allAccessoryProducts = [];

// Cart functions
function getCart() {
    return JSON.parse(localStorage.getItem('cart') || '[]');
}

function setCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartCount() {
    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => el.textContent = count);
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    loadAccessoryProducts();
    updateCartCount(); // Cập nhật số lượng giỏ hàng khi trang load
}); 
