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
async function loadAccessoryProducts() {
    try {
        console.log('🔍 Fetching products with category_id=4 (Khác)...');
        const response = await fetch('/api/products?category_id=4');
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📦 API response data:', data);
        
        if (data.products && data.products.length > 0) {
            console.log(`✅ Found ${data.products.length} products in category "Khác":`);
            data.products.forEach((product, index) => {
                console.log(`   ${index + 1}. ${product.name} (ID: ${product.id}, Category: ${product.category_id})`);
            });
            
            // Đảm bảo chỉ lấy sản phẩm thuộc category 4
            const khacProducts = data.products.filter(product => product.category_id === 4);
            console.log(`🎯 Filtered to ${khacProducts.length} products with category_id=4`);
            
            allAccessoryProducts = khacProducts;
            displayProducts(khacProducts);
        } else {
            console.log('❌ No products found in category 4 (Khác)');
            allAccessoryProducts = [];
            const grid = document.querySelector('.products-grid');
            if (grid) {
                grid.innerHTML = '<div style="text-align:center;padding:40px;color:#666;">Không có sản phẩm nào thuộc loại "Khác". Vui lòng thêm sản phẩm qua trang Admin.</div>';
            }
        }
    } catch (error) {
        console.error('❌ Error fetching accessory products:', error);
        // Hiển thị thông báo lỗi
        const grid = document.querySelector('.products-grid');
        if (grid) {
            grid.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">Không thể tải dữ liệu sản phẩm. Vui lòng thử lại sau.</div>';
        }
    }
}

// Hiển thị sản phẩm
function displayProducts(products) {
    const grid = document.querySelector('.products-grid');
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
        grid.innerHTML = '<div style="text-align:center;padding:40px;color:#666;">Không có sản phẩm nào thuộc loại "Khác".</div>';
        return;
    }
    
    products.forEach(product => {
        // Check if product is in wishlist
        const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        const isInWishlist = wishlist.some(item => item.id === product.id);
        
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}">
                <button class="wishlist-btn ${isInWishlist ? 'active' : ''}" onclick="toggleWishlist(${product.id}, '${product.name.replace(/'/g, "\\'")}', ${product.price}, '${product.image}')">
                    <i class="fas fa-heart"></i>
                </button>
            </div>
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-price">${Number(product.price).toLocaleString('vi-VN')}đ</div>
                <div class="product-description">${product.description || ''}</div>
                <button class="add-to-cart">Thêm vào giỏ</button>
                <a href="product.html?id=${product.id}" class="btn-detail" style="display:block;margin-top:8px;">Xem chi tiết</a>
            </div>
        `;
        grid.appendChild(card);
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
    
    displayProducts(filteredProducts);
}

// Xử lý tìm kiếm
function searchProducts(query, allProducts) {
    const filtered = allProducts.filter(product => 
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase())
    );
    displayProducts(filtered);
}

// Biến lưu trữ tất cả sản phẩm
let allAccessoryProducts = [];

// === CART POPUP LOGIC ĐỒNG BỘ VỚI DAYDONGHO ===
function getCart() {
    return JSON.parse(localStorage.getItem('cart') || '[]');
}
function setCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}
function updateCartCount() {
    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + (Number(item.qty || item.quantity || 0)), 0);
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
    let html = `<div class=\"cart-popup\" style=\"position:absolute;top:${top}px;left:${left}px;z-index:9999;background:#fff;border-radius:14px;box-shadow:0 8px 32px rgba(0,0,0,0.18);padding:24px 18px;min-width:320px;max-width:95vw;max-height:70vh;overflow:auto;\">`;
    html += '<h3 style=\"margin-bottom:14px;font-size:1.18rem;color:#7c6240;letter-spacing:1px;\">🛒 Giỏ hàng</h3>';
    if (cart.length === 0) {
        html += '<div style=\"padding:18px 0;text-align:center;color:#888;\">Chưa có sản phẩm nào.</div>';
    } else {
        html += '<table style=\"width:100%;border-collapse:collapse;font-size:0.98rem;\">';
        html += '<thead><tr style=\"background:#f8f9fa;\"><th style=\"text-align:left;padding:6px 2px;\">Tên</th><th>SL</th><th>Đơn giá</th><th></th></tr></thead><tbody>';
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
    html += '<button onclick=\"closeCartPopup()\" style=\"margin-top:14px;margin-left:10px;padding:7px 18px;border:none;background:#888;color:#fff;border-radius:7px;cursor:pointer;font-size:0.98rem;float:right;\">Đóng</button>';
    html += '</div>';
    // Xóa popup cũ nếu có
    const old = document.getElementById('cart-popup');
    if (old) old.innerHTML = '';
    const div = document.getElementById('cart-popup');
    if (div) {
        div.style.display = 'block';
        div.innerHTML = html;
    } else {
        const newDiv = document.createElement('div');
        newDiv.id = 'cart-popup';
        newDiv.innerHTML = html;
        document.body.appendChild(newDiv);
    }
    // Gắn sự kiện cho nút tăng/giảm/xóa
    (div || document.getElementById('cart-popup')).querySelectorAll('.cart-qty-btn').forEach(btn => {
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
    (div || document.getElementById('cart-popup')).querySelectorAll('.cart-remove-btn').forEach(btn => {
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

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sanphamkhac.js loaded - Loading accessories from API');
    
    // Load dữ liệu từ API
    loadAccessoryProducts().then(() => {
        // Xử lý filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                filterButtons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                const category = this.textContent;
                if (category === 'Tất cả') {
                    displayProducts(allAccessoryProducts);
                } else {
                    filterProducts(category, allAccessoryProducts);
                }
            });
        });

        // Xử lý tìm kiếm
        const searchInput = document.querySelector('.search-box input');
        const searchButton = document.querySelector('.search-box button');
        
        if (searchButton) {
            searchButton.addEventListener('click', function() {
                searchProducts(searchInput.value, allAccessoryProducts);
            });
        }
        
        if (searchInput) {
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    searchProducts(this.value, allAccessoryProducts);
                }
            });
        }
        
        // Event delegation cho nút "Thêm vào giỏ"
        const productsGrid = document.querySelector('.products-grid');
        if (productsGrid) {
            productsGrid.addEventListener('click', function(e) {
                if (e.target.classList.contains('add-to-cart')) {
                    const card = e.target.closest('.product-card');
                    const name = card ? (card.querySelector('.product-name')?.textContent || '') : '';
                    const priceEl = card ? card.querySelector('.product-price') : null;
                    let price = 0;
                    if (priceEl) {
                        price = Number(priceEl.textContent.replace(/[^\d]/g, ''));
                    }
                    const img = card ? (card.querySelector('img')?.getAttribute('src') || '') : '';
                    const id = allAccessoryProducts.find(p => p.name === name && Number(p.price) === price)?.id || null;
                    if (id) {
                        let cart = JSON.parse(localStorage.getItem('cart') || '[]');
                        const exist = cart.find(item => item.id == id);
                        if (exist) {
                            exist.qty = Number(exist.qty || exist.quantity || 1) + 1;
                        } else {
                            cart.push({ id: id, name: name, price: price, image: img, qty: 1 });
                        }
                        localStorage.setItem('cart', JSON.stringify(cart));
                        updateCartCount();
                        showNotification(`Đã thêm \"${name}\" vào giỏ hàng!`, 'success');
                    } else {
                        showNotification('Không xác định được sản phẩm!', 'error');
                    }
                }
            });
        }
    });
    
    // Bảo vệ: Đảm bảo chỉ hiển thị phụ kiện
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.target.classList.contains('products-grid')) {
                // Kiểm tra xem có sản phẩm nào không phải phụ kiện không
                const cards = mutation.target.querySelectorAll('.product-card');
                let hasNonAccessory = false;
                
                cards.forEach(card => {
                    const name = card.querySelector('.product-name')?.textContent || '';
                    if (name.includes('Đồng hồ') && !name.includes('Đồng hồ Du Lịch')) {
                        hasNonAccessory = true;
                    }
                });
                
                if (hasNonAccessory) {
                    console.log('Detected non-accessory products, re-displaying accessories');
                    setTimeout(() => {
                        displayProducts(allAccessoryProducts);
                    }, 50);
                }
            }
        });
    });
    
    const productsGrid = document.querySelector('.products-grid');
    if (productsGrid) {
        observer.observe(productsGrid, { childList: true, subtree: true });
    }

    updateCartCount();
    const cartBtn = document.querySelector('.dhda-cart');
    if (cartBtn) {
        cartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showCartPopup();
        });
    }
}); 
