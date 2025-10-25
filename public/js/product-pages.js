// Product pages JavaScript with wishlist functionality
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
        const guestSection = document.getElementById('guest-section');
        const userSection = document.getElementById('user-section');
        const userDisplayName = document.getElementById('user-display-name');
        
        if (guestSection) guestSection.style.display = 'none';
        if (userSection) userSection.style.display = 'flex';
        if (userDisplayName) userDisplayName.textContent = userData.full_name || userData.username || userData.fullName || userData.email || '';
        
        // Ẩn link profile nếu là admin
        const profileLink = document.querySelector('a[href="profile.html"]');
        
        if (userData.role === 'admin') {
            if (profileLink) profileLink.style.display = 'none';
        } else {
            if (profileLink) profileLink.style.display = 'inline';
        }
    } else {
        // User is not logged in
        const guestSection = document.getElementById('guest-section');
        const userSection = document.getElementById('user-section');
        
        if (guestSection) guestSection.style.display = 'flex';
        if (userSection) userSection.style.display = 'none';
    }
}

// Wishlist functions
function getWishlist() {
    return JSON.parse(localStorage.getItem('wishlist') || '[]');
}

function setWishlist(wishlist) {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
}

function toggleWishlist(productId, productName, productPrice, productImage) {
    // Kiểm tra đăng nhập trước khi cho phép thêm vào wishlist
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const user = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    if (!isLoggedIn && !(token && user)) {
        showNotification('Vui lòng đăng nhập để thêm sản phẩm vào danh sách yêu thích!', 'warning');
        // Hiển thị modal đăng nhập nếu có
        const loginOptionsModal = document.getElementById('loginOptionsModal');
        if (loginOptionsModal) {
            loginOptionsModal.style.display = 'block';
        } else {
            // Chuyển hướng đến trang đăng nhập
            window.location.href = 'login.html';
        }
        return;
    }
    
    const wishlist = getWishlist();
    const existingIndex = wishlist.findIndex(item => item.id === productId);
    
    if (existingIndex !== -1) {
        // Remove from wishlist
        wishlist.splice(existingIndex, 1);
        showNotification('Đã xóa khỏi danh sách yêu thích!', 'info');
    } else {
        // Add to wishlist
        wishlist.push({
            id: productId,
            name: productName,
            price: productPrice,
            image: productImage
        });
        showNotification('Đã thêm vào danh sách yêu thích!', 'success');
    }
    
    setWishlist(wishlist);
    updateWishlistUI();
    
    // Trigger custom event for profile page
    window.dispatchEvent(new CustomEvent('wishlistUpdated'));
}

function updateWishlistUI() {
    const wishlist = getWishlist();
    const wishlistButtons = document.querySelectorAll('.wishlist-btn');
    
    wishlistButtons.forEach(btn => {
        const onclick = btn.getAttribute('onclick');
        if (onclick) {
            const match = onclick.match(/toggleWishlist\((\d+)/);
            if (match) {
                const productId = parseInt(match[1]);
                const isInWishlist = wishlist.some(item => item.id === productId);
                
                if (isInWishlist) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            }
        }
    });
}

// Login options modal functions
function showLoginOptions() {
    const loginOptionsModal = document.getElementById('loginOptionsModal');
    if (loginOptionsModal) {
        loginOptionsModal.style.display = 'block';
    }
}

function closeLoginOptions() {
    const loginOptionsModal = document.getElementById('loginOptionsModal');
    if (loginOptionsModal) {
        loginOptionsModal.style.display = 'none';
    }
}

// User dropdown functions
function toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

function closeUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.remove('show');
    }
}

// User menu functions
function showProfile() {
    // Kiểm tra đăng nhập trước khi hiển thị profile
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const user = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    if (!isLoggedIn && !(token && user)) {
        showNotification('Vui lòng đăng nhập để xem thông tin tài khoản!', 'warning');
        showLoginOptions();
        return;
    }
    
    // Chuyển hướng đến trang profile
    window.location.href = 'profile.html';
    closeUserDropdown();
}

function showOrders() {
    // Kiểm tra đăng nhập trước khi hiển thị orders
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const user = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    if (!isLoggedIn && !(token && user)) {
        showNotification('Vui lòng đăng nhập để xem đơn hàng!', 'warning');
        showLoginOptions();
        return;
    }
    
    // Chuyển hướng đến trang orders
    window.location.href = 'orders.html';
    closeUserDropdown();
}

function showWishlist() {
    // Kiểm tra đăng nhập trước khi hiển thị wishlist
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const user = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    if (!isLoggedIn && !(token && user)) {
        showNotification('Vui lòng đăng nhập để xem danh sách yêu thích!', 'warning');
        showLoginOptions();
        return;
    }
    
    // Chuyển hướng đến trang profile để xem wishlist
    window.location.href = 'profile.html';
    closeUserDropdown();
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
    
    // Close dropdown
    closeUserDropdown();
    
    // Redirect to login page
    window.location.href = 'login.html';
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication status
    checkAuthStatus();
    
    // Initialize wishlist UI
    updateWishlistUI();
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        const userSection = document.getElementById('user-section');
        const dropdown = document.getElementById('userDropdown');
        
        if (userSection && !userSection.contains(event.target)) {
            closeUserDropdown();
        }
        
        // Close login options modal when clicking outside
        const loginOptionsModal = document.getElementById('loginOptionsModal');
        if (loginOptionsModal && event.target === loginOptionsModal) {
            closeLoginOptions();
        }
    });
    
    // Listen for wishlist updates
    window.addEventListener('wishlistUpdated', function() {
        updateWishlistUI();
    });
}); 
