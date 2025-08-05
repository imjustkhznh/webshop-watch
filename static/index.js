// Authentication functions
function checkAuthStatus() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const user = localStorage.getItem('user') || sessionStorage.getItem('user');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if ((token && user) || isLoggedIn) {
        // User is logged in
        const userData = user ? JSON.parse(user) : {};
        document.getElementById('guest-section').style.display = 'none';
        document.getElementById('user-section').style.display = 'flex';
        document.getElementById('user-display-name').textContent = userData.full_name || userData.username || userData.fullName || userData.email || '';
        
        // Ẩn link profile nếu là admin
        const profileLink = document.querySelector('a[href="profile.html"]');
        
        if (userData.role === 'admin') {
            if (profileLink) profileLink.style.display = 'none';
        } else {
            if (profileLink) profileLink.style.display = 'inline';
        }
    } else {
        // User is not logged in
        document.getElementById('guest-section').style.display = 'flex';
        document.getElementById('user-section').style.display = 'none';
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
    
    // Close dropdown
    closeUserDropdown();
    
    // Redirect to login page
    window.location.href = 'login.html';
}

// User dropdown functions
function toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.classList.toggle('show');
}

function closeUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.remove('show');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const userSection = document.getElementById('user-section');
    const dropdown = document.getElementById('userDropdown');
    
    if (userSection && !userSection.contains(event.target)) {
        closeUserDropdown();
    }
});

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

// Login options modal functions
function showLoginOptions() {
    document.getElementById('loginOptionsModal').style.display = 'block';
}

function closeLoginOptions() {
    document.getElementById('loginOptionsModal').style.display = 'none';
}

// Modal functions
function showRegisterModal() {
    document.getElementById('registerModal').style.display = 'block';
    closeLoginOptions();
}

function closeRegisterModal() {
    document.getElementById('registerModal').style.display = 'none';
    // Reset form
    document.getElementById('registerForm').reset();
}

// Search functionality
function initSearch() {
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    
    if (searchForm && searchInput) {
        // Debounce function để tránh gọi API quá nhiều
        let searchTimeout;
        
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (query) {
                performSearch(query);
            }
        });
        
        // Real-time search as user types với debounce
        searchInput.addEventListener('input', function() {
            const query = this.value.trim();
            
            // Clear previous timeout
            clearTimeout(searchTimeout);
            
            if (query.length >= 2) {
                // Delay search by 300ms to avoid too many API calls
                searchTimeout = setTimeout(() => {
                    performSearch(query);
                }, 300);
            } else if (query.length === 0) {
                // Reset title and load all products when search is cleared
                const title = document.querySelector('.products h3');
                if (title) {
                    title.textContent = 'Sản phẩm nổi bật';
                }
                loadProducts();
            }
        });
        
        // Clear search when user clicks X button (if exists)
        searchInput.addEventListener('search', function() {
            if (this.value === '') {
                const title = document.querySelector('.products h3');
                if (title) {
                    title.textContent = 'Sản phẩm nổi bật';
                }
                loadProducts();
            }
        });
    }
}

async function performSearch(query) {
    try {
        // Hiển thị loading state
        const productList = document.querySelector('.product-list');
        if (productList) {
            productList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-search" style="font-size: 32px; color: #7c6240; margin-bottom: 16px;"></i>
                    <p>Đang tìm kiếm...</p>
                </div>
            `;
        }
        
        // Tìm kiếm trong dữ liệu sản phẩm hiện có
        const response = await fetch('/api/products');
        if (response.ok) {
            const data = await response.json();
            const allProducts = data.products || data || [];
            
            // Kiểm tra xem allProducts có phải là array không
            if (!Array.isArray(allProducts)) {
                console.error('allProducts is not an array:', allProducts);
                if (productList) {
                    productList.innerHTML = `
                        <div style="text-align: center; padding: 40px; color: #666;">
                            <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #f39c12; margin-bottom: 16px;"></i>
                            <h3>Lỗi dữ liệu</h3>
                            <p>Dữ liệu sản phẩm không đúng định dạng. Vui lòng thử lại.</p>
                            <button onclick="performSearch('${query}')" style="margin-top: 16px; padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                Thử lại
                            </button>
                        </div>
                    `;
                }
                return;
            }
            
            // Lọc sản phẩm theo từ khóa tìm kiếm
            const searchResults = allProducts.filter(product => {
                const searchTerm = query.toLowerCase();
                const productName = (product.name || '').toLowerCase();
                const productBrand = (product.brand || '').toLowerCase();
                const productCategory = (product.category || '').toLowerCase();
                const productDescription = (product.description || '').toLowerCase();
                
                // Tìm kiếm chính xác hơn cho các thương hiệu
                const brandKeywords = {
                    'casio': ['casio', 'g-shock', 'baby-g', 'edifice', 'protrek'],
                    'seiko': ['seiko', 'presage', '5 sports', 'diver'],
                    'citizen': ['citizen', 'eco-drive', 'promaster'],
                    'orient': ['orient', 'bambino', 'mako', 'ray'],
                    'tissot': ['tissot', 't-touch', 'prc200', 'le locle']
                };
                
                // Kiểm tra tên sản phẩm và thương hiệu
                if (productName.includes(searchTerm) || productBrand.includes(searchTerm)) {
                    return true;
                }
                
                // Kiểm tra từ khóa thương hiệu
                for (const [brand, keywords] of Object.entries(brandKeywords)) {
                    if (searchTerm.includes(brand) || keywords.some(keyword => searchTerm.includes(keyword))) {
                        if (productBrand.includes(brand) || productName.includes(brand)) {
                            return true;
                        }
                    }
                }
                
                // Kiểm tra category và description
                return productCategory.includes(searchTerm) || productDescription.includes(searchTerm);
            });
            
            // Update page title to show search results
            const title = document.querySelector('.products h3');
            if (title) {
                if (searchResults.length > 0) {
                    title.textContent = `Kết quả tìm kiếm cho "${query}" (${searchResults.length} sản phẩm)`;
                } else {
                    title.textContent = `Không tìm thấy sản phẩm cho "${query}"`;
                }
            }
            
            // Hiển thị kết quả hoặc thông báo không tìm thấy
            if (searchResults.length > 0) {
                displayProducts(searchResults);
            } else {
                if (productList) {
                    productList.innerHTML = `
                        <div style="text-align: center; padding: 40px; color: #666; grid-column: 1 / -1;">
                            <i class="fas fa-search" style="font-size: 48px; color: #ccc; margin-bottom: 16px;"></i>
                            <h3>Không tìm thấy sản phẩm</h3>
                            <p>Không có sản phẩm nào phù hợp với từ khóa "<strong>${query}</strong>"</p>
                            <p style="margin-top: 16px; font-size: 0.9rem; color: #999;">
                                Thử tìm kiếm với từ khóa khác hoặc xem tất cả sản phẩm
                            </p>
                            <button onclick="loadProducts(); document.getElementById('searchInput').value = '';" 
                                    style="margin-top: 16px; padding: 10px 20px; background: #7c6240; color: white; border: none; border-radius: 6px; cursor: pointer;">
                                Xem tất cả sản phẩm
                            </button>
                        </div>
                    `;
                }
            }
        } else {
            console.error('Failed to load products for search');
            if (productList) {
                productList.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #666;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #f39c12; margin-bottom: 16px;"></i>
                        <h3>Lỗi tìm kiếm</h3>
                        <p>Không thể tải dữ liệu sản phẩm. Vui lòng thử lại.</p>
                        <button onclick="performSearch('${query}')" style="margin-top: 16px; padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            Thử lại
                        </button>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Search error:', error);
        const productList = document.querySelector('.product-list');
        if (productList) {
            productList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #f39c12; margin-bottom: 16px;"></i>
                    <h3>Lỗi kết nối</h3>
                    <p>Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.</p>
                </div>
            `;
        }
    }
}

// Close modals when clicking outside
window.onclick = function(event) {
    const registerModal = document.getElementById('registerModal');
    const loginOptionsModal = document.getElementById('loginOptionsModal');
    
    if (event.target === registerModal) {
        closeRegisterModal();
    }
    
    if (event.target === loginOptionsModal) {
        closeLoginOptions();
    }
}

// Register form submission
var registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('regUsername').value;
        const email = document.getElementById('regEmail').value;
        const fullName = document.getElementById('regFullName').value;
        const password = document.getElementById('regPassword').value;
        
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    full_name: fullName
                })
            });

            const data = await response.json();

            if (response.ok) {
                showNotification('Đăng ký thành công! Vui lòng đăng nhập.', 'success');
                closeRegisterModal();
            } else {
                showNotification(data.error || 'Đăng ký thất bại. Vui lòng thử lại.', 'error');
            }
            
        } catch (error) {
            console.error('Registration error:', error);
            showNotification('Lỗi kết nối. Vui lòng kiểm tra lại kết nối mạng.', 'error');
        }
    });
}

function onLoginSuccess(user) {
    // Lưu thông tin user vào localStorage
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('isLoggedIn', 'true');
    if (user.token) {
        localStorage.setItem('token', user.token);
    }
    
    // Ẩn phần guest
    document.getElementById('guest-section').style.display = 'none';
    // Hiện phần user
    document.getElementById('user-section').style.display = 'flex';
    // Gán tên user vào dòng chào
    document.getElementById('user-display-name').textContent = user.full_name || user.username || user.email || '';
}

function hideGuestIconIfLoggedIn() {
    if (localStorage.getItem('isLoggedIn') === 'true') {
        document.getElementById('guest-section').style.display = 'none';
        document.getElementById('user-section').style.display = 'flex';
    }
}

// Gọi hàm này khi trang load
hideGuestIconIfLoggedIn();

// Load products from API
async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        const data = await response.json();
        
        if (response.ok) {
            const products = data.products || data || [];
            
            // Kiểm tra xem products có phải là array không
            if (!Array.isArray(products)) {
                console.error('products is not an array:', products);
                const productList = document.querySelector('.product-list');
                if (productList) {
                    productList.innerHTML = `
                        <div style="text-align: center; padding: 40px; color: #666;">
                            <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #f39c12; margin-bottom: 16px;"></i>
                            <h3>Lỗi dữ liệu</h3>
                            <p>Dữ liệu sản phẩm không đúng định dạng. Vui lòng thử lại.</p>
                            <button onclick="loadProducts()" style="margin-top: 16px; padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                Thử lại
                            </button>
                        </div>
                    `;
                }
                return;
            }
            
            // Lọc bỏ sản phẩm có category_id = 9 (đồng hồ treo tường)
            let filteredProducts = products.filter(p => Number(p.category_id) !== 9);
            
            // Loại bỏ sản phẩm mới nhất (id lớn nhất hoặc created_at mới nhất)
            if (filteredProducts.length > 0) {
                // Nếu có trường created_at, loại sản phẩm có created_at mới nhất
                if (filteredProducts[0].created_at) {
                    let maxCreatedAt = Math.max(...filteredProducts.map(p => new Date(p.created_at).getTime()));
                    filteredProducts = filteredProducts.filter(p => new Date(p.created_at).getTime() !== maxCreatedAt);
                } else {
                    // Nếu không có created_at, loại sản phẩm có id lớn nhất
                    let maxId = Math.max(...filteredProducts.map(p => Number(p.id)));
                    filteredProducts = filteredProducts.filter(p => Number(p.id) !== maxId);
                }
            }
            displayProducts(filteredProducts);
        } else {
            console.error('Failed to load products');
            const productList = document.querySelector('.product-list');
            if (productList) {
                productList.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #666;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #f39c12; margin-bottom: 16px;"></i>
                        <h3>Không thể tải sản phẩm</h3>
                        <p>Vui lòng thử lại sau hoặc liên hệ hỗ trợ</p>
                        <button onclick="loadProducts()" style="margin-top: 16px; padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            Thử lại
                        </button>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading products:', error);
        // Hiển thị thông báo lỗi cho user
        const productList = document.querySelector('.product-list');
        if (productList) {
            productList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #f39c12; margin-bottom: 16px;"></i>
                    <h3>Lỗi kết nối</h3>
                    <p>Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.</p>
                    <button onclick="loadProducts()" style="margin-top: 16px; padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Thử lại
                    </button>
                </div>
            `;
        }
    }
}

function displayProducts(products) {
    const productList = document.querySelector('.product-list');
    if (!productList) return;
    // Clear existing products
    productList.innerHTML = '';
    // Hiển thị tối đa 10 sản phẩm
    products.slice(0, 10).forEach(product => {
        let discount = Number(product.discount) || 0;
        let originalPrice = Number(product.original_price) || Number(product.price);
        let salePrice = Number(product.price);
        // Nếu có discount và original_price, tính lại salePrice
        if (discount > 0) {
            salePrice = Math.round(originalPrice * (1 - discount / 100));
        }
        
        // Check if product is in wishlist
        const wishlist = getWishlist();
        const isInWishlist = wishlist.some(item => item.id === product.id);
        
        productList.innerHTML += `
            <div class="product-card">
                ${discount > 0 ? `<span class="discount-badge">-${discount}%</span>` : ''}
                <button class="wishlist-btn ${isInWishlist ? 'active' : ''}" onclick="toggleWishlist(${product.id}, '${product.name.replace(/'/g, "\\'")}', ${product.price}, '${product.image}')">
                    <i class="fas fa-heart"></i>
                </button>
                <a href="product.html?id=${product.id}">
                    <img src="${product.image}" alt="${product.name}">
                </a>
                <h4>
                    <a href="product.html?id=${product.id}" style="color:inherit;text-decoration:none;">
                        ${product.name}
                    </a>
                </h4>
                <div class="price-group">
                    ${discount > 0 ? `<span class="old-price">${formatPrice(originalPrice)}</span>` : ''}
                    <span class="sale-price">${formatPrice(salePrice)}</span>
                </div>
                <button onclick="addToCart(${product.id}, '${product.name.replace(/'/g, "\\'")}', ${product.price}, '${product.image}')">Thêm vào giỏ</button>
                <a href="product.html?id=${product.id}" class="btn btn-detail" style="display:block;margin-top:8px;">Xem chi tiết</a>
            </div>
        `;
    });
}

function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

// Giỏ hàng lưu ở localStorage
function getCart() {
    return JSON.parse(localStorage.getItem('cart') || '[]');
}
function setCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}
async function addToCart(productId, productName, productPrice, productImage) {
    try {
        // Kiểm tra tồn kho trước khi thêm
        const response = await fetch(`/api/products/${productId}`);
        const data = await response.json();
        
        if (!data.product) {
            showNotification('Không thể lấy thông tin sản phẩm!', 'error');
            return;
        }
        
        const stockQuantity = Number(data.product.stock) || 0;
        
        // Kiểm tra tồn kho
        if (stockQuantity <= 0) {
            showNotification('Sản phẩm đã hết hàng!', 'warning');
            return;
        }
        
        let cart = getCart();
        const idx = cart.findIndex(item => item.id === productId);
        
        // Kiểm tra số lượng hiện tại trong giỏ hàng
        const currentQuantity = idx !== -1 ? cart[idx].quantity : 0;
        
        // Kiểm tra xem có vượt quá tồn kho không
        if (currentQuantity >= stockQuantity) {
            showNotification(`🚨 CHỈ CÒN ${stockQuantity} SẢN PHẨM! 🚨\n⚡ Nhanh tay đặt hàng trước khi hết!`, 'warning');
            return;
        }
        
        if (idx !== -1) {
            cart[idx].quantity += 1;
        } else {
            cart.push({ id: productId, name: productName, price: productPrice, image: productImage, quantity: 1 });
        }
        setCart(cart);
        updateCartCount();
        showNotification('Đã thêm vào giỏ hàng!', 'success');
    } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification('Có lỗi xảy ra khi thêm vào giỏ hàng!', 'error');
    }
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

function toggleWishlist(productId, productName, productPrice, productImage) {
    // Kiểm tra đăng nhập trước khi cho phép thêm vào wishlist
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const user = localStorage.getItem('user') || sessionStorage.getItem('user');

    if (!isLoggedIn && !(token && user)) {
        showNotification('Vui lòng đăng nhập để thêm sản phẩm vào danh sách yêu thích!', 'warning');
        showLoginOptions();
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
        const productId = parseInt(btn.getAttribute('onclick').match(/toggleWishlist\((\d+)/)[1]);
        const isInWishlist = wishlist.some(item => item.id === productId);
        
        if (isInWishlist) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}
// Hiển thị popup giỏ hàng
window.showCartPopup = function() {
    let cart = getCart();
    // Xác định vị trí icon giỏ hàng
    const cartBtn = document.querySelector('.dhda-cart');
    let rect = cartBtn ? cartBtn.getBoundingClientRect() : {top:70,right:30};
    // Popup hiển thị ngay dưới icon giỏ hàng
    let top = rect.bottom + window.scrollY + 8;
    let left = rect.right + window.scrollX - 360; // 360 là chiều rộng popup, căn phải
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
            const lineTotal = price * item.quantity;
            total += lineTotal;
            html += `<tr style='border-bottom:1px solid #eee;'>
                <td style='padding:6px 2px;'>${item.name}</td>
                <td style='min-width:60px;'>
                    <button class='cart-qty-btn' data-idx='${idx}' data-action='decrease' style='padding:2px 8px;border-radius:6px;border:1px solid #ccc;background:#f5f5f5;font-weight:700;'>-</button>
                    <span style='margin:0 6px;font-weight:600;'>${item.quantity}</span>
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
    if (old) old.remove();
    const div = document.createElement('div');
    div.id = 'cart-popup';
    div.innerHTML = html;
    document.body.appendChild(div);
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
                    const stockQuantity = Number(data.product.stock) || 0;
                    
                    if (cart[idx].quantity >= stockQuantity) {
                        showNotification(`🚨 CHỈ CÒN ${stockQuantity} SẢN PHẨM! 🚨\n⚡ Nhanh tay đặt hàng trước khi hết!`, 'warning');
                        return;
                    }
                    cart[idx].quantity++;
                } catch (error) {
                    console.error('Error checking stock:', error);
                    alert('Không thể kiểm tra tồn kho!');
                    return;
                }
            }
            
            if (action === 'decrease' && cart[idx].quantity > 1) {
                cart[idx].quantity--;
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
    const popup = document.getElementById('cart-popup');
    if (popup) popup.remove();
}

// Đảm bảo các hàm có thể truy cập từ global scope
window.closeCartPopup = closeCartPopup;

// Đảm bảo hàm checkoutCart có thể truy cập từ global scope
window.checkoutCart = function() {
    const cart = getCart();
    if (cart.length === 0) {
        alert('Giỏ hàng trống!');
        return;
    }
    window.location.href = 'checkout.html';
};
// Gắn sự kiện cho nút giỏ hàng trên header
// (Đã di chuyển sự kiện Sửa sản phẩm lên trên để ưu tiên modal) 
window.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
    const cartBtn = document.querySelector('.dhda-cart');
    if (cartBtn) {
        cartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showCartPopup();
        });
    }
});
// Sửa các nút Thêm vào giỏ để truyền tên sản phẩm
window.addEventListener('DOMContentLoaded', function() {
    document.body.addEventListener('click', function(e) {
        if (e.target.matches('button.add-to-cart')) {
            const card = e.target.closest('.product-card, .product-info');
            if (card) {
                const nameEl = card.querySelector('.product-name');
                const id = e.target.getAttribute('data-id') || card.getAttribute('data-id');
                if (id && nameEl) {
                    addToCart(Number(id), nameEl.textContent.trim());
                }
            }
        }
    });
});

// Đảm bảo chỉ 1 section hiển thị
window.onload = function() {
    if (localStorage.getItem('isLoggedIn') === 'true') {
        document.getElementById('guest-section').style.display = 'none';
        document.getElementById('user-section').style.display = 'flex';
        var user = JSON.parse(localStorage.getItem('user')) || {};
        document.getElementById('user-display-name').textContent = user.full_name || user.username || user.email || '';
    } else {
        document.getElementById('guest-section').style.display = 'flex';
        document.getElementById('user-section').style.display = 'none';
    }
}

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

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    updateCartCount();
    initSearch(); // Initialize search functionality
    updateWishlistUI(); // Initialize wishlist UI

    // Kiểm tra URL parameter để hiển thị kết quả tìm kiếm
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    
    if (searchQuery) {
        // Có query tìm kiếm từ trang khác
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = searchQuery;
        }
        performSearch(searchQuery);
    } else {
        // Không có query, load tất cả sản phẩm
        loadProducts();
    }

    // Sửa: Gán lại giá trị cũ vào form khi bấm Sửa sản phẩm (chỉ chạy trên trang admin)
    const productsTable = document.querySelector('#products .table tbody');
    if (productsTable) {
        productsTable.addEventListener('click', function(e) {
            if (e.target.classList.contains('btn-edit')) {
                const row = e.target.closest('tr');
                if (!row) return;
                document.getElementById('productName').value = row.children[1].textContent.trim();
                document.getElementById('productCategory').value = row.getAttribute('data-category');
                document.getElementById('productBrand').value = row.getAttribute('data-brand');
                document.getElementById('productPrice').value = row.getAttribute('data-price') || row.children[4].textContent.replace('đ','').replace(/,/g,'');
                document.getElementById('productStock').value = row.getAttribute('data-stock') || row.children[5].textContent.trim();
                document.getElementById('productImage').value = row.getAttribute('data-image') || '';
                document.getElementById('productDescription').value = row.getAttribute('data-description') || '';
                // Hiển thị modal sửa
                document.getElementById('addProductModal').style.display = 'block';
                // Nếu có ảnh cũ, hiển thị preview
                const imgPreview = document.getElementById('currentImagePreview');
                if (imgPreview && row.getAttribute('data-image')) {
                    imgPreview.innerHTML = `<img src="${row.getAttribute('data-image')}" alt="Ảnh sản phẩm" style="max-width:120px;max-height:90px;border-radius:8px;box-shadow:0 2px 8px #eee;">`;
                } else if (imgPreview) {
                    imgPreview.innerHTML = '';
                }
            }
        });
    }

    // Thêm sự kiện cho nút đăng xuất
    var logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Logout button clicked!');
            // Gọi hàm logout để xử lý đăng xuất
            logout();
        });
    }
});

// Giả sử biến products chứa danh sách sản phẩm (array of objects)
// Nếu bạn lấy từ API hoặc localStorage thì thay thế cho phù hợp
const products = window.products || []; // hoặc lấy từ nơi bạn lưu trữ

const PRODUCTS_PER_PAGE = 12; // 3 dòng x 4 cột
let currentPage = 1;

function renderProductsPage(page) {
    const productList = document.querySelector('.product-list');
    if (!productList) return;
    productList.innerHTML = '';

    const startIdx = (page - 1) * PRODUCTS_PER_PAGE;
    const endIdx = startIdx + PRODUCTS_PER_PAGE;
    const pageProducts = products.slice(startIdx, endIdx);

    pageProducts.forEach(product => {
        // Tạo HTML cho từng sản phẩm, ví dụ:
        const div = document.createElement('div');
        div.className = 'product-card';
        div.innerHTML = `
            <img src="${product.image}" alt="${product.name}" />
            <h4>${product.name}</h4>
            <div class="product-price">${product.price} đ</div>
            <button class="add-to-cart-btn">Thêm vào giỏ</button>
            <button class="view-detail-btn">Xem chi tiết</button>
        `;
        productList.appendChild(div);
    });
}