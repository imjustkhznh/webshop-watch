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
        
        // Xử lý nút "Thêm vào giỏ"
        document.querySelectorAll('.add-to-cart').forEach(btn => {
            btn.addEventListener('click', function() {
                const productName = this.parentElement.querySelector('.product-name').textContent;
                showNotification(`Đã thêm "${productName}" vào giỏ hàng!`, 'success');
            });
        });
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
}); 