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

// Authentication functions
function checkAuthStatus() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const user = localStorage.getItem('user') || sessionStorage.getItem('user');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if ((token && user) || isLoggedIn) {
        // User is logged in
        const userData = user ? JSON.parse(user) : {};
        
        // Kiểm tra role - chặn admin truy cập vào trang profile
        if (userData.role === 'admin') {
            showNotification('Tài khoản admin không thể truy cập vào trang cá nhân khách hàng!', 'error');
            window.location.href = 'admin.html';
            return null;
        }
        
        document.getElementById('guest-section').style.display = 'none';
        document.getElementById('user-section').style.display = 'flex';
        document.getElementById('user-display-name').textContent = userData.full_name || userData.username || userData.fullName || userData.email || '';
        return userData;
    } else {
        // User is not logged in
        document.getElementById('guest-section').style.display = 'flex';
        document.getElementById('user-section').style.display = 'none';
        // Redirect to login if not authenticated
        window.location.href = 'login.html';
        return null;
    }
}

function logout() {
    // Xóa tất cả thông tin đăng nhập
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.clear();
    
    // Redirect to login page
    window.location.href = 'login.html';
}

// Cart functions
function getCart() {
    return JSON.parse(localStorage.getItem('cart') || '[]');
}

function updateCartCount() {
    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => el.textContent = count);
}

// Wishlist functions
function getWishlist() {
    return JSON.parse(localStorage.getItem('wishlist') || '[]');
}

function setWishlist(wishlist) {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
}

// Tab navigation
function initTabs() {
    const tabs = document.querySelectorAll('.nav-tab');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            this.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
            
            // Load content based on tab
            loadTabContent(targetTab);
        });
    });
}

// Load content based on active tab
function loadTabContent(tabName) {
    switch(tabName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'profile':
            loadProfile();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'wishlist':
            loadWishlist();
            break;
    }
    
    // Always refresh dashboard stats when switching tabs to ensure accuracy
    if (tabName !== 'dashboard') {
        loadDashboardStats();
    }
}

// Dashboard functions
async function loadDashboard() {
    await Promise.all([
        loadDashboardStats(),
        loadRecentOrders()
    ]);
}

async function loadDashboardStats() {
    try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) return;

        const response = await fetch('/api/orders/user', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const orders = data.orders || [];
            
            // Calculate stats
            const totalOrders = orders.length;
            const totalSpent = orders.reduce((sum, order) => {
                const amount = parseFloat(order.total_amount) || 0;
                return sum + amount;
            }, 0);
            const pendingOrders = orders.filter(order => order.status === 'pending').length;
            const wishlist = getWishlist();
            const totalWishlist = wishlist.length;
            
            // Update stats display
            document.getElementById('totalOrders').textContent = totalOrders;
            document.getElementById('totalSpent').textContent = formatPrice(totalSpent);
            document.getElementById('pendingOrders').textContent = pendingOrders;
            document.getElementById('totalWishlist').textContent = totalWishlist;
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

async function loadRecentOrders() {
    try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) return;

        const response = await fetch('/api/orders/user', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const orders = data.orders || [];
            
            const recentOrdersList = document.getElementById('recentOrdersList');
            
            if (orders.length === 0) {
                recentOrdersList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-shopping-bag"></i>
                        <h3>Chưa có đơn hàng nào</h3>
                        <p>Bạn chưa có đơn hàng nào. Hãy bắt đầu mua sắm ngay!</p>
                        <a href="index.html" class="back-to-shop">Mua sắm ngay</a>
                    </div>
                `;
                return;
            }
            
            // Show recent 5 orders
            const recentOrders = orders.slice(0, 5);
            recentOrdersList.innerHTML = recentOrders.map(order => {
                const statusClass = `status-${order.status}`;
                const statusText = getStatusText(order.status);
                const formattedDate = formatDate(order.created_at);
                const formattedAmount = formatPrice(parseFloat(order.total_amount) || 0);
                
                return `
                    <div class="order-item">
                        <div class="order-info">
                            <h4>Đơn hàng #${order.id}</h4>
                            <p>${formattedDate} - ${formattedAmount}</p>
                        </div>
                        <div class="order-status ${statusClass}">${statusText}</div>
                    </div>
                `;
            }).join('');
        }
    } catch (error) {
        console.error('Error loading recent orders:', error);
    }
}

// Profile functions
function loadProfile() {
    const userData = checkAuthStatus();
    if (!userData) return;
    
    // Fill form with user data
    document.getElementById('fullName').value = userData.full_name || userData.username || userData.fullName || '';
    document.getElementById('email').value = userData.email || '';
    document.getElementById('phone').value = userData.phone || '';
    document.getElementById('address').value = userData.address || '';
}

// Initialize profile form
function initProfileForm() {
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = {
                full_name: document.getElementById('fullName').value,
                phone: document.getElementById('phone').value,
                address: document.getElementById('address').value
            };
            
            try {
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                const response = await fetch('/api/profile/update', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                });
                
                if (response.ok) {
                    showNotification('Cập nhật thông tin thành công!', 'success');
                    // Update local storage
                    const userData = JSON.parse(localStorage.getItem('user') || '{}');
                    Object.assign(userData, formData);
                    localStorage.setItem('user', JSON.stringify(userData));
                } else {
                    showNotification('Có lỗi xảy ra khi cập nhật thông tin!', 'error');
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                showNotification('Có lỗi xảy ra khi cập nhật thông tin!', 'error');
            }
        });
    }
}

// Orders functions
let allOrders = [];
let currentOrderFilter = 'all';
let pendingCancelOrderId = null;

async function loadOrders() {
    try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) return;

        const response = await fetch('/api/orders/user', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            allOrders = data.orders || [];
            displayOrders();
        } else {
            console.error('Failed to load orders');
            showEmptyOrders();
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        showEmptyOrders();
    }
}

function displayOrders() {
    const ordersList = document.getElementById('ordersList');
    
    // Filter orders based on current filter
    const filteredOrders = currentOrderFilter === 'all' 
        ? allOrders 
        : allOrders.filter(order => order.status === currentOrderFilter);
    
    if (filteredOrders.length === 0) {
        showEmptyOrders();
        return;
    }
    
    ordersList.innerHTML = filteredOrders.map(order => {
        const statusClass = `status-${order.status}`;
        const statusText = getStatusText(order.status);
        const formattedDate = formatDate(order.created_at);
        const formattedAmount = formatPrice(parseFloat(order.total_amount) || 0);
        
        return `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-id">Đơn hàng #${order.id}</div>
                    <div class="order-date">${formattedDate}</div>
                    <div class="order-status ${statusClass}">${statusText}</div>
                </div>
                <div class="order-products">
                    ${order.order_details ? order.order_details.map(detail => `
                        <div class="product-item">
                            <img src="${detail.product_image || 'static/dongho1.webp'}" alt="${detail.product_name}" class="product-image">
                            <div class="product-info">
                                <h4>${detail.product_name}</h4>
                                <p>Số lượng: ${detail.quantity} x ${formatPrice(parseFloat(detail.price) || 0)}</p>
                            </div>
                        </div>
                    `).join('') : '<p>Không có thông tin sản phẩm</p>'}
                </div>
                <div class="order-footer">
                    <div class="order-total">Tổng: ${formattedAmount}</div>
                    <div class="order-actions">
                        <button class="action-btn btn-detail" style="background:#2196f3;color:#fff;" onclick="viewOrderDetail(${order.id})">
                            <i class="fas fa-eye"></i> Chi tiết
                        </button>
                        ${order.status === 'delivered' ? `
                            <button class="action-btn btn-reorder" onclick="reorderItems(${order.id})">
                                <i class="fas fa-redo"></i> Đặt lại
                            </button>
                        ` : ''}
                        ${(order.status === 'pending' || order.status === 'processing') ? `
                            <button class="action-btn btn-cancel" style="background:#e53935;color:#fff;" onclick="cancelOrder(${order.id})">
                                <i class="fas fa-times"></i> Hủy đơn
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function showEmptyOrders() {
    const ordersList = document.getElementById('ordersList');
    ordersList.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-shopping-bag"></i>
            <h3>Chưa có đơn hàng nào</h3>
            <p>Bạn chưa có đơn hàng nào. Hãy bắt đầu mua sắm ngay!</p>
            <a href="index.html" class="back-to-shop">Mua sắm ngay</a>
        </div>
    `;
}

// Initialize order filters
function initOrderFilters() {
    const filterButtons = document.querySelectorAll('.order-filters .filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Update current filter
            currentOrderFilter = this.getAttribute('data-filter');
            
            // Display filtered orders
            displayOrders();
        });
    });
}

// Wishlist functions
function loadWishlist() {
    const wishlist = getWishlist();
    const wishlistGrid = document.getElementById('wishlistGrid');
    
    if (wishlist.length === 0) {
        wishlistGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-heart"></i>
                <h3>Chưa có sản phẩm yêu thích</h3>
                <p>Bạn chưa có sản phẩm nào trong danh sách yêu thích. Hãy bắt đầu mua sắm ngay!</p>
                <a href="index.html" class="back-to-shop">Mua sắm ngay</a>
            </div>
        `;
        return;
    }
    
    wishlistGrid.innerHTML = wishlist.map(item => {
        const safeId = parseInt(item.id) || 0;
        const safePrice = parseFloat(item.price) || 0;
        const safeName = item.name || 'Sản phẩm không tên';
        const safeImage = item.image || 'static/dongho1.webp';
        
        return `
            <div class="wishlist-item">
                <button class="remove-wishlist" onclick="removeFromWishlist(${safeId})" title="Xóa khỏi yêu thích">
                    <i class="fas fa-times"></i>
                </button>
                <div class="wishlist-product">
                    <img src="${safeImage}" alt="${safeName}" class="wishlist-image">
                    <div class="wishlist-info">
                        <h4>${safeName}</h4>
                        <div class="wishlist-price">${formatPrice(safePrice)}</div>
                    </div>
                </div>
                <div class="wishlist-actions">
                    <button class="wishlist-btn btn-add-cart" onclick="addToCartFromWishlist(${safeId}, '${safeName.replace(/'/g, "\\'")}', ${safePrice}, '${item.image}')">
                        <i class="fas fa-shopping-cart"></i> Thêm vào giỏ
                    </button>
                    <button class="wishlist-btn btn-view" onclick="viewProduct(${safeId})">
                        <i class="fas fa-eye"></i> Xem chi tiết
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function removeFromWishlist(productId) {
    const wishlist = getWishlist();
    const safeProductId = parseInt(productId) || 0;
    const updatedWishlist = wishlist.filter(item => {
        const itemId = parseInt(item.id) || 0;
        return itemId !== safeProductId;
    });
    setWishlist(updatedWishlist);
    loadWishlist();
    loadDashboardStats(); // Update dashboard stats
    
    // Trigger custom event for other pages
    window.dispatchEvent(new CustomEvent('wishlistUpdated'));
}

function addToCartFromWishlist(productId, productName, productPrice, productImage) {
    // Tìm nút và thêm loading state
    const button = event.target.closest('.btn-add-cart');
    if (button) {
        button.classList.add('loading');
        button.disabled = true;
    }
    
    setTimeout(() => {
        let cart = getCart();
        const safeProductId = parseInt(productId) || 0;
        const safeProductName = productName || 'Sản phẩm không tên';
        const safeProductPrice = parseFloat(productPrice) || 0;
        
        const existingItem = cart.find(item => parseInt(item.id) === safeProductId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id: safeProductId,
                name: safeProductName,
                price: safeProductPrice,
                image: productImage,
                quantity: 1
            });
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        showNotification('Đã thêm vào giỏ hàng!', 'success');
        
        // Xóa loading state
        if (button) {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }, 500);
}

function viewProduct(productId) {
    // Tìm nút và thêm loading state
    const button = event.target.closest('.btn-view');
    if (button) {
        button.classList.add('loading');
        button.disabled = true;
    }
    
    setTimeout(() => {
        const safeProductId = parseInt(productId) || 0;
        if (safeProductId > 0) {
            window.location.href = `product.html?id=${safeProductId}`;
        } else {
            showNotification('Không thể xem chi tiết sản phẩm này!', 'error');
            // Xóa loading state nếu có lỗi
            if (button) {
                button.classList.remove('loading');
                button.disabled = false;
            }
        }
    }, 300);
}

// Utility functions
function getStatusText(status) {
    const statusMap = {
        'pending': 'Chờ xử lý',
        'processing': 'Đang xử lý',
        'delivered': 'Đã giao',
        'cancelled': 'Đã hủy'
    };
    return statusMap[status] || status;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatPrice(price) {
    // Đảm bảo price là số hợp lệ
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice)) {
        return '0 ₫';
    }
    
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(numericPrice);
}

// Action functions
function viewOrderDetail(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) {
        showNotification('Không tìm thấy thông tin đơn hàng!', 'error');
        return;
    }
    
    const modal = document.getElementById('orderDetailModal');
    const content = document.getElementById('orderDetailContent');
    
    const statusText = getStatusText(order.status);
    const formattedDate = formatDate(order.created_at);
    const formattedAmount = formatPrice(parseFloat(order.total_amount) || 0);
    
    content.innerHTML = `
        <h2 style="color: #7c6240; margin-bottom: 20px; text-align: center;">
            <i class="fas fa-receipt"></i> Chi Tiết Đơn Hàng #${order.id}
        </h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <div>
                    <strong>Mã đơn hàng:</strong> #${order.id}
                </div>
                <div>
                    <strong>Ngày đặt:</strong> ${formattedDate}
                </div>
                <div>
                    <strong>Trạng thái:</strong> 
                    <span class="status-${order.status}" style="padding: 4px 8px; border-radius: 4px; font-size: 0.9em;">
                        ${statusText}
                    </span>
                </div>
                <div>
                    <strong>Tổng tiền:</strong> ${formattedAmount}
                </div>
            </div>
        </div>
        
        <div style="margin-bottom: 20px;">
            <h3 style="color: #7c6240; margin-bottom: 15px;">
                <i class="fas fa-shopping-bag"></i> Sản Phẩm Đã Đặt
            </h3>
            <div style="background: white; border-radius: 10px; padding: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                ${order.order_details ? order.order_details.map(detail => `
                    <div style="display: flex; align-items: center; padding: 15px; border-bottom: 1px solid #eee; margin-bottom: 10px;">
                        <img src="${detail.product_image || 'static/dongho1.webp'}" 
                             alt="${detail.product_name}" 
                             style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; margin-right: 15px;">
                        <div style="flex: 1;">
                            <h4 style="margin: 0 0 5px 0; color: #333;">${detail.product_name}</h4>
                            <p style="margin: 0; color: #666;">Số lượng: ${detail.quantity}</p>
                            <p style="margin: 5px 0 0 0; color: #7c6240; font-weight: 600;">
                                Đơn giá: ${formatPrice(parseFloat(detail.price) || 0)}
                            </p>
                        </div>
                        <div style="text-align: right;">
                            <strong style="color: #e53935;">
                                ${formatPrice((parseFloat(detail.price) || 0) * (parseInt(detail.quantity) || 0))}
                            </strong>
                        </div>
                    </div>
                `).join('') : '<p style="text-align: center; color: #666;">Không có thông tin sản phẩm</p>'}
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
            <button onclick="closeOrderDetailModal()" style="padding: 10px 20px; background: #7c6240; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">
                <i class="fas fa-times"></i> Đóng
            </button>
            ${order.status === 'delivered' ? `
                <button onclick="reorderItems(${order.id}); closeOrderDetailModal();" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    <i class="fas fa-redo"></i> Đặt Lại
                </button>
            ` : ''}
        </div>
    `;
    
    modal.style.display = 'block';
}

function closeOrderDetailModal() {
    const modal = document.getElementById('orderDetailModal');
    modal.style.display = 'none';
}

function reorderItems(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order || !order.order_details) {
        showNotification('Không thể tìm thấy thông tin đơn hàng!', 'error');
        return;
    }
    
    let cart = getCart();
    
    order.order_details.forEach(detail => {
        const existingItem = cart.find(item => item.id === detail.product_id);
        if (existingItem) {
            existingItem.quantity += detail.quantity;
        } else {
            cart.push({
                id: detail.product_id,
                name: detail.product_name,
                price: detail.price,
                quantity: detail.quantity
            });
        }
    });
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showNotification('Đã thêm tất cả sản phẩm từ đơn hàng vào giỏ hàng!', 'success');
}

function cancelOrder(orderId) {
    pendingCancelOrderId = orderId;
    document.getElementById('cancelOrderText').innerHTML = `Bạn chắc chắn muốn hủy đơn hàng <b>#${orderId}</b> này?`;
    document.getElementById('cancelOrderModal').style.display = 'flex';
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    const userData = checkAuthStatus();
    if (!userData) return;
    
    updateCartCount();
    initTabs();
    initProfileForm();
    initOrderFilters();
    
    // Load initial dashboard
    loadDashboard();
    
    // Add logout event listener
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    
    // Listen for wishlist changes from other pages
    window.addEventListener('storage', function(e) {
        if (e.key === 'wishlist') {
            // Update dashboard stats when wishlist changes
            loadDashboardStats();
            
            // If currently on wishlist tab, reload it
            const activeTab = document.querySelector('.nav-tab.active');
            if (activeTab && activeTab.getAttribute('data-tab') === 'wishlist') {
                loadWishlist();
            }
        }
    });
    
    // Also listen for custom events (for same-page updates)
    window.addEventListener('wishlistUpdated', function() {
        loadDashboardStats();
        const activeTab = document.querySelector('.nav-tab.active');
        if (activeTab && activeTab.getAttribute('data-tab') === 'wishlist') {
            loadWishlist();
        }
    });
    
    // Refresh dashboard when page becomes visible (user returns from other tab)
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            loadDashboardStats();
        }
    });
    
    // Refresh dashboard when window gains focus
    window.addEventListener('focus', function() {
        loadDashboardStats();
    });
    
    // Close order detail modal when clicking outside
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('orderDetailModal');
        if (event.target === modal) {
            closeOrderDetailModal();
        }
    });

    // Modal xác nhận hủy đơn hàng
    document.getElementById('closeCancelOrderBtn').onclick = function() {
        document.getElementById('cancelOrderModal').style.display = 'none';
        pendingCancelOrderId = null;
    };
    document.getElementById('cancelOrderModal').onclick = function(e) {
        if (e.target === this) {
            this.style.display = 'none';
            pendingCancelOrderId = null;
        }
    };
    document.getElementById('confirmCancelOrderBtn').onclick = function() {
        if (!pendingCancelOrderId) return;
        const orderId = pendingCancelOrderId;
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        fetch(`/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'cancelled' })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showNotification('Đã hủy đơn hàng #' + orderId, 'success');
                const order = allOrders.find(o => o.id === orderId);
                if (order) order.status = 'cancelled';
                displayOrders();
            } else {
                showNotification('Không thể hủy đơn hàng!', 'error');
            }
            document.getElementById('cancelOrderModal').style.display = 'none';
            pendingCancelOrderId = null;
        })
        .catch(() => {
            showNotification('Có lỗi khi hủy đơn hàng!', 'error');
            document.getElementById('cancelOrderModal').style.display = 'none';
            pendingCancelOrderId = null;
        });
    };
}); 
