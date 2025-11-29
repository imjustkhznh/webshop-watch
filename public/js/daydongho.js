// Lọc và hiển thị sản phẩm loại "dây đồng hồ"
async function loadDayDongHoProducts() {
    try {
        const res = await fetch('/api/products');
        const data = await res.json();
        // Lọc sản phẩm có category_name hoặc category là "dây đồng hồ" (không phân biệt hoa thường)
        const filtered = data.products.filter(p => {
            if (p.category_name) {
                return p.category_name.trim().toLowerCase().includes('dây đồng hồ');
            }
            if (p.category) {
                return p.category.trim().toLowerCase().includes('dây đồng hồ');
            }
            return false;
        });
        renderDayDongHoProducts(filtered);
    } catch (err) {
        console.error('Lỗi khi tải sản phẩm dây đồng hồ:', err);
    }
}

function renderDayDongHoProducts(products) {
    const grid = document.querySelector('.product-list');
    if (!grid) return;
    grid.innerHTML = '';
    if (products.length === 0) {
        grid.innerHTML = '<p>Không có sản phẩm dây đồng hồ nào.</p>';
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
        <div class="product-card" data-id="${product.id}">
            <div class="product-image">
                <img src="${imageUrl}" alt="${product.name}">
                <button class="wishlist-btn ${isInWishlist ? 'active' : ''}" onclick="toggleWishlist(${product.id}, '${product.name.replace(/'/g, "\\'")}', ${salePrice}, '${imageUrl}')">
                    <i class="fas fa-heart"></i>
                </button>
                ${discount > 0 ? `<span class="discount-badge">-${discount}%</span>` : ''}
            </div>
            <div class="product-info">
                <h4 class="product-name">${product.name}</h4>
                <div class="price-group">
                    ${discount > 0 ? `<span class="old-price">${originalPrice.toLocaleString('vi-VN', {style:'currency',currency:'VND'})}</span>` : ''}
                    <span class="sale-price">${salePrice.toLocaleString('vi-VN', {style:'currency',currency:'VND'})}</span>
                </div>
                <div class="button-group">
                    <button class="add-to-cart" data-id="${product.id}">Thêm vào giỏ</button>
                    <a href="product.html?id=${product.id}" class="btn-detail">Xem chi tiết</a>
                </div>
            </div>
        </div>
        `;
    });
}

document.addEventListener('DOMContentLoaded', loadDayDongHoProducts);

// Lắng nghe nút "Xem chi tiết" để chuyển trang

document.addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-detail')) {
        const id = e.target.getAttribute('data-id');
        if (id) {
            window.location.href = `product.html?id=${id}`;
        }
    }
});

// Lắng nghe sự kiện click cho nút "Thêm vào giỏ hàng"
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('add-to-cart')) {
        const id = e.target.getAttribute('data-id');
        // Lấy thông tin sản phẩm từ DOM
        const card = e.target.closest('.product-card');
        const name = card ? (card.querySelector('h4')?.textContent || card.querySelector('.product-name')?.textContent || '') : '';
        const priceEl = card ? card.querySelector('.sale-price') : null;
        let price = 0;
        if (priceEl) {
            // Lấy số từ chuỗi "1.000.000đ"
            price = Number(priceEl.textContent.replace(/[^\d]/g, ''));
        }
        const img = card ? (card.querySelector('img')?.getAttribute('src') || '') : '';
        if (id) {
            let cart = JSON.parse(localStorage.getItem('cart') || '[]');
            const exist = cart.find(item => item.id == id);
            if (exist) {
                exist.qty = Number(exist.qty || exist.quantity || 1) + 1;
            } else {
                cart.push({ id: id, name: name, price: price, image: img, qty: 1 });
            }
            localStorage.setItem('cart', JSON.stringify(cart));
            // Cập nhật số lượng hiển thị trên icon giỏ hàng nếu có
            const cartCount = document.querySelector('.cart-count');
            if (cartCount) {
                cartCount.textContent = cart.reduce((sum, item) => sum + Number(item.qty || item.quantity || 1), 0);
            }
            showNotification('Đã thêm vào giỏ hàng!', 'success');
        }
    }
});

// === CART POPUP LOGIC GIỐNG INDEX ===
function getCart() {
    return JSON.parse(localStorage.getItem('cart') || '[]');
}
function setCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}
function updateCartCount() {
    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + (Number(item.qty) || Number(item.quantity) || 0), 0);
    document.querySelectorAll('.cart-count').forEach(el => el.textContent = count);
}
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}
window.showCartPopup = function() {
    let cart = getCart();
    const cartBtn = document.querySelector('.dhda-cart');
    let rect = cartBtn ? cartBtn.getBoundingClientRect() : {top:70,right:30};
    let top = rect.bottom + window.scrollY + 8;
    let left = rect.right + window.scrollX - 360;
    if (left < 8) left = 8;
    let html = `<div class="cart-popup" style="position:absolute;top:${top}px;left:${left}px;z-index:9999;background:#fff;border-radius:14px;box-shadow:0 8px 32px rgba(0,0,0,0.18);padding:24px 18px;min-width:320px;max-width:95vw;max-height:70vh;overflow:auto;">`;
    html += '<h3 style="margin-bottom:14px;font-size:1.18rem;color:#7c6240;letter-spacing:1px;">🛒 Giỏ hàng</h3>';
    if (cart.length === 0) {
        html += '<div style="padding:18px 0;text-align:center;color:#888;">Chưa có sản phẩm nào.</div>';
    } else {
        html += '<table style="width:100%;border-collapse:collapse;font-size:0.98rem;">';
        html += '<thead><tr style="background:#f8f9fa;"><th style="text-align:left;padding:6px 2px;">Tên</th><th>SL</th><th>Đơn giá</th><th></th></tr></thead><tbody>';
        let total = 0;
        cart.forEach((item, idx) => {
            const price = item.price || 0;
            const qty = Number(item.qty || item.quantity || 1);
            const lineTotal = price * qty;
            total += lineTotal;
            html += `<tr style='border-bottom:1px solid #eee;'>
                <td style='padding:6px 2px;'>${item.name || ''}</td>
                <td style='min-width:60px;'>
                    <button class='cart-qty-btn' data-idx='${idx}' data-action='decrease' style='padding:2px 8px;border-radius:6px;border:1px solid #ccc;background:#f5f5f5;font-weight:700;'>-</button>
                    <span style='margin:0 6px;font-weight:600;'>${qty}</span>
                    <button class='cart-qty-btn' data-idx='${idx}' data-action='increase' style='padding:2px 8px;border-radius:6px;border:1px solid #ccc;background:#f5f5f5;font-weight:700;'>+</button>
                </td>
                <td style='color:#7c6240;font-weight:600;'>${formatPrice(price)}</td>
                <td><button class='cart-remove-btn' data-idx='${idx}' style='color:#e53935;background:none;border:none;font-size:1.1rem;cursor:pointer;' title='Xóa'>&times;</button></td>
            </tr>`;
        });
        html += `</tbody></table><div style='margin-top:10px;font-weight:700;font-size:1.05rem;text-align:right;'>Tổng: <span id='cart-total' style='color:#e53935;'>${formatPrice(total)}</span></div>`;
        html += `<button onclick='checkoutCart()' style='margin-top:14px;padding:8px 22px;border:none;background:#7c6240;color:#fff;border-radius:7px;cursor:pointer;font-size:1rem;font-weight:600;'>Thanh toán</button>`;
    }
    html += '<button onclick="closeCartPopup()" style="margin-top:14px;margin-left:10px;padding:7px 18px;border:none;background:#888;color:#fff;border-radius:7px;cursor:pointer;font-size:0.98rem;float:right;">Đóng</button>';
    html += '</div>';
    // Xóa popup cũ nếu có
    const old = document.getElementById('cart-popup');
    if (old) old.innerHTML = '';
    const div = document.getElementById('cart-popup');
    div.style.display = 'block';
    div.innerHTML = html;
    // Gắn sự kiện cho nút tăng/giảm/xóa
    div.querySelectorAll('.cart-qty-btn').forEach(btn => {
        btn.addEventListener('click', async function(e) {
            e.stopPropagation();
            const idx = Number(this.getAttribute('data-idx'));
            const action = this.getAttribute('data-action');
            let cart = getCart();
            if (action === 'increase') {
                // Kiểm tra tồn kho trước khi tăng
                try {
                    const response = await fetch(`/api/products/${cart[idx].id}`);
                    const data = await response.json();
                    const stockQuantity = Number(data.product?.stock) || 0;
                    const currentQty = Number(cart[idx].qty || cart[idx].quantity || 1);
                    if (currentQty >= stockQuantity) {
                        showNotification(`🚨 CHỈ CÒN ${stockQuantity} SẢN PHẨM!<br>⚡ Nhanh tay đặt hàng trước khi hết!`, 'warning', 5000);
                        return;
                    }
                    cart[idx].qty = currentQty + 1;
                } catch (error) {
                    console.error('Error checking stock:', error);
                    alert('Không thể kiểm tra tồn kho!');
                    return;
                }
            }
            if (action === 'decrease' && (cart[idx].qty || cart[idx].quantity) > 1) {
                cart[idx].qty = Number(cart[idx].qty || cart[idx].quantity || 1) - 1;
            }
            setCart(cart);
            showCartPopup();
        });
    });
    div.querySelectorAll('.cart-remove-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const idx = Number(this.getAttribute('data-idx'));
            let cart = getCart();
            cart.splice(idx, 1);
            setCart(cart);
            showCartPopup();
        });
    });
}
function closeCartPopup() {
    const div = document.getElementById('cart-popup');
    if (div) {
        div.style.display = 'none';
        div.innerHTML = '';
    }
}
window.closeCartPopup = closeCartPopup;
window.checkoutCart = function() {
    const cart = getCart();
    if (cart.length === 0) {
        alert('Giỏ hàng trống!');
        return;
    }
    window.location.href = 'checkout.html';
};
document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
    const cartBtn = document.querySelector('.dhda-cart');
    if (cartBtn) {
        cartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showCartPopup();
        });
    }
});

// Custom Notification Function (copy từ index.js)
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
        case 'error': icon = 'fas fa-exclamation-circle'; break;
        case 'warning': icon = 'fas fa-exclamation-triangle'; break;
        case 'info': icon = 'fas fa-info-circle'; break;
        default: icon = 'fas fa-check-circle';
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
    document.body.appendChild(notification);
    setTimeout(() => { notification.classList.add('show'); }, 100);
    if (duration > 0) {
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => { if (notification.parentElement) notification.remove(); }, 400);
        }, duration);
    }
}
