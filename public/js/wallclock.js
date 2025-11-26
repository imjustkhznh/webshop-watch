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

// Hiển thị sản phẩm loại treo tường
async function loadWallClockProducts() {
            const res = await fetch('/api/products');
    const data = await res.json();
    // Lọc sản phẩm có category_name hoặc category là 'treo tường' (không phân biệt hoa thường)
    const filtered = data.products.filter(p => {
        if (p.category_name) {
            return p.category_name.trim().toLowerCase().includes('treo tường');
        }
        if (p.category) {
            return p.category.trim().toLowerCase().includes('treo tường');
        }
        return false;
    });
    renderWallClockProducts(filtered);
}

function renderWallClockProducts(products) {
    const grid = document.getElementById('wallclock-grid');
    if (!grid) return;
    grid.innerHTML = '';
    if (!products.length) {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#888;font-size:1.2rem;">Không có sản phẩm treo tường nào.</div>';
        return;
    }
    products.forEach(product => {
        let discount = Number(product.discount) || 0;
        let originalPrice = Number(product.original_price) || Number(product.price);
        let salePrice = Number(product.price);
        if (discount > 0) {
            salePrice = Math.round(originalPrice * (1 - discount / 100));
        }
        const imageUrl = resolveImagePath(product.image);
        
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
}



document.addEventListener('DOMContentLoaded', function() {
    loadWallClockProducts();
    updateCartCount(); // Cập nhật số lượng giỏ hàng khi trang load
});

