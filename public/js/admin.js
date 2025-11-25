// ===== PROMOTION (DISCOUNT CODE) LOGIC =====

// Hiện modal thêm mã giảm giá
function openAddPromotionModal() {
    document.getElementById('addPromotionModal').style.display = 'block';
}

// Đóng modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

// Thêm mới mã giảm giá
const addPromotionForm = document.getElementById('addPromotionForm');
if (addPromotionForm) {
    addPromotionForm.onsubmit = async function(e) {
        e.preventDefault();
        const code = document.getElementById('promotionName').value.trim();
        const description = document.getElementById('promotionDescription').value.trim();
        const discount_type = document.getElementById('discountType').value;
        const discount_value = document.getElementById('promotionDiscount').value;
        const min_order_amount = document.getElementById('minOrderAmount').value;
        // Có thể bổ sung max_uses, valid_until nếu cần
        try {
            const response = await fetch('/api/admin/discount-codes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ code, description, discount_type, discount_value, min_order_amount })
            });
            const result = await response.json();
            if (response.ok) {
                showNotification('Thêm mã giảm giá thành công!', 'success');
                closeModal('addPromotionModal');
                addPromotionForm.reset();
                loadPromotions();
            } else {
                showNotification('Lỗi: ' + (result.error || 'Không thể thêm mã giảm giá'), 'error');
            }
        } catch (error) {
            showNotification('Lỗi kết nối khi thêm mã giảm giá', 'error');
        }
    };
}

// Hiện modal sửa mã giảm giá
let editingDiscountId = null;
function editDiscountCode(id) {
    const codeRow = document.querySelector(`button[onclick="editDiscountCode(${id})"]`);
    if (!codeRow) return;
    // Lấy dữ liệu từ data-attribute
    document.getElementById('promotionName').value = codeRow.getAttribute('data-code') || '';
    document.getElementById('promotionDescription').value = codeRow.getAttribute('data-description') || '';
    document.getElementById('discountType').value = codeRow.getAttribute('data-type') || '';
    document.getElementById('promotionDiscount').value = codeRow.getAttribute('data-value') || '';
    document.getElementById('minOrderAmount').value = codeRow.getAttribute('data-min') || '';
    editingDiscountId = id;
    document.getElementById('addPromotionModal').style.display = 'block';
    // Đổi nút submit thành "Cập nhật"
    document.getElementById('submitPromotionBtn').textContent = 'Cập nhật';
}

// Xử lý cập nhật mã giảm giá khi đang ở chế độ sửa
if (addPromotionForm) {
    addPromotionForm.onsubmit = async function(e) {
        e.preventDefault();
        const code = document.getElementById('promotionName').value.trim();
        const description = document.getElementById('promotionDescription').value.trim();
        const discount_type = document.getElementById('discountType').value;
        const discount_value = document.getElementById('promotionDiscount').value;
        const min_order_amount = document.getElementById('minOrderAmount').value;
        try {
            let response, result;
            if (editingDiscountId) {
                response = await fetch(`/api/admin/discount-codes/${editingDiscountId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ code, description, discount_type, discount_value, min_order_amount })
                });
                result = await response.json();
                if (response.ok) {
                    showNotification('Cập nhật mã giảm giá thành công!', 'success');
                } else {
                    showNotification('Lỗi: ' + (result.error || 'Không thể cập nhật mã giảm giá'), 'error');
                }
            } else {
                response = await fetch('/api/admin/discount-codes', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ code, description, discount_type, discount_value, min_order_amount })
                });
                result = await response.json();
                if (response.ok) {
                    showNotification('Thêm mã giảm giá thành công!', 'success');
                } else {
                    showNotification('Lỗi: ' + (result.error || 'Không thể thêm mã giảm giá'), 'error');
                }
            }
            closeModal('addPromotionModal');
            addPromotionForm.reset();
            editingDiscountId = null;
            document.getElementById('submitPromotionBtn').textContent = 'Thêm mã giảm giá';
            loadPromotions();
        } catch (error) {
            showNotification('Lỗi kết nối khi lưu mã giảm giá', 'error');
        }
    };
}

// Xóa mã giảm giá
async function deleteDiscountCode(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa mã giảm giá này?')) return;
    try {
        const response = await fetch(`/api/admin/discount-codes/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const result = await response.json();
        if (response.ok) {
            showNotification('Xóa mã giảm giá thành công!', 'success');
            loadPromotions();
        } else {
            showNotification('Lỗi: ' + (result.error || 'Không thể xóa mã giảm giá'), 'error');
        }
    } catch (error) {
        showNotification('Lỗi kết nối khi xóa mã giảm giá', 'error');
    }
}

window.openAddPromotionModal = openAddPromotionModal;
window.closeModal = closeModal;
window.editDiscountCode = editDiscountCode;
window.deleteDiscountCode = deleteDiscountCode;
// Sidebar navigation: chuyển trang khi click menu
document.addEventListener('DOMContentLoaded', function() {
    const sidebarLinks = document.querySelectorAll('.sidebar .nav-link');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            if (href) {
                window.location.href = href;
            }
        });
    });
    // Nếu đang ở dashboard, tự động load đơn hàng cho bảng dashboard
    if (document.getElementById('dashboardOrdersTableBody')) {
        loadOrders();
    }
});
// Load stock data for admin-stock.html
async function loadStock() {
    try {
        const response = await fetch('/api/products');
        const data = await response.json();
        if (response.ok && data.products) {
            displayStock(data.products);
        } else {
            showNotification('Không thể tải dữ liệu tồn kho', 'error');
        }
    } catch (error) {
        showNotification('Lỗi kết nối khi tải tồn kho', 'error');
    }
}

function displayStock(products) {
    const stockTbody = document.getElementById('stockTableBody');
    if (!stockTbody) return;
    stockTbody.innerHTML = '';
    if (!products || products.length === 0) {
        stockTbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#aaa;">Không có dữ liệu tồn kho</td></tr>';
        return;
    }
    products.forEach(product => {
        let status = '', statusClass = '';
        if (product.stock === 0) {
            status = 'Hết hàng';
            statusClass = 'status-outstock';
        } else if (product.stock <= 10) {
            status = 'Sắp hết hàng';
            statusClass = 'status-processing';
        } else {
            status = 'Bình thường';
            statusClass = 'status-instock';
        }
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>SP${String(product.id).padStart(3, '0')}</td>
            <td>${product.name}</td>
            <td>${product.brand_name || 'N/A'}</td>
            <td>${product.stock}</td>
            <td><span class="status ${statusClass}">${status}</span></td>
            <td>
                <button class="btn btn-edit btn-sm" onclick="editProduct(${product.id})">Sửa</button>
            </td>
        `;
        stockTbody.appendChild(row);
    });
}

window.loadStock = loadStock;
window.displayStock = displayStock;
// Vẽ biểu đồ tròn doanh thu theo thương hiệu
function renderPieChart(brandData) {
    if (!window.Chart) return;
    const ctx = document.getElementById('dashboardPieChart');
    if (!ctx) return;
    if (window.dashboardPieChartInstance) {
        window.dashboardPieChartInstance.destroy();
    }
    const labels = brandData.map(b => b.brand);
    const data = brandData.map(b => b.revenue);
    window.dashboardPieChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels,
            datasets: [{
                label: 'Tỉ lệ doanh thu theo thương hiệu',
                data,
                backgroundColor: [
                    '#3498db','#e67e22','#27ae60','#8e44ad','#f39c12','#1abc9c','#c0392b','#34495e','#9b59b6','#2ecc71'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: true } }
        }
    });
}

// Vẽ biểu đồ đường doanh thu theo ngày
function renderLineChart(dailyData) {
    if (!window.Chart) return;
    const ctx = document.getElementById('dashboardLineChart');
    if (!ctx) return;
    if (window.dashboardLineChartInstance) {
        window.dashboardLineChartInstance.destroy();
    }
    const labels = dailyData.map(d => {
        const date = new Date(d.date);
        return date.toLocaleDateString('vi-VN');
    }).reverse();
    const revenueData = dailyData.map(d => d.revenue || 0).reverse();
    window.dashboardLineChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Doanh thu',
                    data: revenueData,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52,152,219,0.1)',
                    tension: 0.3,
                    fill: true,
                    pointRadius: 5,
                    pointBackgroundColor: '#3498db',
                    pointBorderColor: '#fff',
                    pointHoverRadius: 7,
                    pointHoverBackgroundColor: '#3498db',
                    pointHoverBorderColor: '#e67e22',
                    borderWidth: 3
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true },
                tooltip: { enabled: true }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Doanh thu (VND)' }
                }
            }
        }
    });
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

// Admin page JavaScript
console.log('Admin page JavaScript loaded successfully!');

// Global variables
let products = [];
let currentPage = 1;
const productsPerPage = 10;

// Load products from API
async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        const data = await response.json();
        
        if (response.ok && data.products) {
            products = data.products;
            displayProducts();
            updateProductStats();
        } else {
            console.error('Failed to load products:', data.error);
            showNotification('Không thể tải danh sách sản phẩm', 'error');
        }
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Lỗi kết nối khi tải sản phẩm', 'error');
    }
}

// Display products in table and mobile cards
function displayProducts() {
    const productTable = document.querySelector('#products .table tbody');
    const mobileCardsContainer = document.querySelector('#products .mobile-cards');
    
    if (!productTable && !mobileCardsContainer) return;

    // Clear existing content
    if (productTable) productTable.innerHTML = '';
    if (mobileCardsContainer) mobileCardsContainer.innerHTML = '';

    // Calculate pagination
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const pageProducts = products.slice(startIndex, endIndex);

    pageProducts.forEach(product => {
        // Logic mới: ≤ 10 = "Sắp hết hàng", > 10 = "Bình thường", 0 = "Hết hàng"
        let status, statusClass;
        if (product.stock === 0) {
            status = 'Hết hàng';
            statusClass = 'status-outstock';
        } else if (product.stock <= 10) {
            status = 'Sắp hết hàng';
            statusClass = 'status-processing';
        } else {
            status = 'Bình thường';
            statusClass = 'status-instock';
        }
        
        // Desktop table row
        if (productTable) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>SP${String(product.id).padStart(3, '0')}</td>
                <td>${product.name}</td>
                <td>${product.category_name || 'N/A'}</td>
                <td>${product.brand_name || 'N/A'}</td>
                <td>${formatPrice(product.price)}</td>
                <td>${product.stock}</td>
                <td><span class="status ${statusClass}">${status}</span></td>
                <td>
                    <button class="btn btn-edit" onclick="editProduct(${product.id})" data-id="${product.id}" data-name="${product.name}" data-category="${product.category_id}" data-brand="${product.brand_id}" data-price="${product.price}" data-stock="${product.stock}" data-image="${product.image}" data-description="${product.description}">
                        Sửa
                    </button>
                    <button class="btn btn-delete" onclick="deleteProduct(${product.id})">
                        Xóa
                    </button>
                </td>
            `;
            productTable.appendChild(row);
        }
        
        // Mobile card
        if (mobileCardsContainer) {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <div class="product-card-header">
                    <span class="product-id">SP${String(product.id).padStart(3, '0')}</span>
                    <span class="product-status ${statusClass}">${status}</span>
                </div>
                <div class="product-name">${product.name}</div>
                <div class="product-details">
                    <div class="product-detail">
                        <span class="product-detail-label">Loại</span>
                        <span class="product-detail-value">${product.category_name || 'N/A'}</span>
                    </div>
                    <div class="product-detail">
                        <span class="product-detail-label">Thương hiệu</span>
                        <span class="product-detail-value">${product.brand_name || 'N/A'}</span>
                    </div>
                    <div class="product-detail">
                        <span class="product-detail-label">Giá</span>
                        <span class="product-detail-value price">${formatPrice(product.price)}</span>
                    </div>
                    <div class="product-detail">
                        <span class="product-detail-label">Tồn kho</span>
                        <span class="product-detail-value quantity">${product.stock}</span>
                    </div>
                </div>
                <div class="product-actions">
                    <button class="btn btn-warning btn-sm" onclick="editProduct(${product.id})" data-id="${product.id}" data-name="${product.name}" data-category="${product.category_id}" data-brand="${product.brand_id}" data-price="${product.price}" data-stock="${product.stock}" data-image="${product.image}" data-description="${product.description}">
                        <i class="fas fa-edit"></i> Sửa
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteProduct(${product.id})">
                        <i class="fas fa-trash"></i> Xóa
                    </button>
                </div>
            `;
            mobileCardsContainer.appendChild(card);
        }
    });

    // Update pagination
    updatePagination();
}

// Update product statistics
function updateProductStats() {
    const totalProducts = products.length;
    const inStock = products.filter(p => p.stock > 0).length;
    const outOfStock = products.filter(p => p.stock === 0).length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

    // Update stats display if elements exist
    const statsContainer = document.querySelector('#dashboard .stats-grid');
    if (statsContainer) {
        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-box"></i>
                </div>
                <div class="stat-content">
                    <h3>${totalProducts}</h3>
                    <p>Tổng sản phẩm</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="stat-content">
                    <h3>${inStock}</h3>
                    <p>Còn hàng</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-times-circle"></i>
                </div>
                <div class="stat-content">
                    <h3>${outOfStock}</h3>
                    <p>Hết hàng</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-dollar-sign"></i>
                </div>
                <div class="stat-content">
                    <h3>${formatPrice(totalValue)}</h3>
                    <p>Tổng giá trị</p>
                </div>
            </div>
        `;
    }
}

// Update pagination
function updatePagination() {
    const totalPages = Math.ceil(products.length / productsPerPage);
    
    // Update page info
    const currentPageNum = document.getElementById('currentPageNum');
    const totalPagesSpan = document.getElementById('totalPages');
    const showingProducts = document.getElementById('showingProducts');
    const totalProducts = document.getElementById('totalProducts');
    
    if (currentPageNum) currentPageNum.textContent = currentPage;
    if (totalPagesSpan) totalPagesSpan.textContent = totalPages;
    if (showingProducts) {
        const startIndex = (currentPage - 1) * productsPerPage + 1;
        const endIndex = Math.min(currentPage * productsPerPage, products.length);
        showingProducts.textContent = `${startIndex}-${endIndex}`;
    }
    if (totalProducts) totalProducts.textContent = products.length;
    
    // Update button states
    const prevButtons = document.querySelectorAll('.btn-prev');
    const nextButtons = document.querySelectorAll('.btn-next');
    
    prevButtons.forEach(btn => {
        btn.disabled = currentPage === 1;
        btn.style.opacity = currentPage === 1 ? '0.5' : '1';
        btn.style.cursor = currentPage === 1 ? 'not-allowed' : 'pointer';
    });
    
    nextButtons.forEach(btn => {
        btn.disabled = currentPage === totalPages;
        btn.style.opacity = currentPage === totalPages ? '0.5' : '1';
        btn.style.cursor = currentPage === totalPages ? 'not-allowed' : 'pointer';
    });
}

// Change page
function changePage(page) {
    const totalPages = Math.ceil(products.length / productsPerPage);
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        displayProducts();
    }
}

// Format price
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        max-width: 400px;
        word-wrap: break-word;
    `;

    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#27ae60';
            break;
        case 'error':
            notification.style.backgroundColor = '#e74c3c';
            break;
        default:
            notification.style.backgroundColor = '#3498db';
    }

    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Tab switching function
function showTab(event, tabName) {
    // Hide all tab content
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.style.display = 'none';
    });

    // Remove active class from all nav links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });

    // Show the selected tab content
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.style.display = 'block';
    }

    // Add active class to the clicked nav link
    event.currentTarget.classList.add('active');

    // Load data for the selected tab
    if (tabName === 'products') {
        loadProducts();
    } else if (tabName === 'dashboard') {
        updateProductStats();
    } else if (tabName === 'customers') {
        loadCustomers();
    }
}

// Initialize admin page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin page initialized');
    // Check if user is admin
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    // Detect page and load data accordingly
    const mainContent = document.querySelector('.main-content');
    if (mainContent && mainContent.id === 'stock') {
        loadStock();
    } else if (mainContent && mainContent.id === 'products') {
        loadProducts();
    } else if (mainContent && mainContent.id === 'customers') {
        loadCustomers();
    } else if (mainContent && mainContent.id === 'brands') {
        loadBrands();
    } else if (mainContent && mainContent.id === 'promotions') {
        loadPromotions && loadPromotions();
    } else if (mainContent && mainContent.id === 'orders') {
        loadOrders();
    } else if (mainContent && mainContent.id === 'dashboard') {
        loadReports();
    }
});

// Mobile menu functions
function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

function closeMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
}

// Mobile tab switching
function showMobileTab(tabName) {
    // Hide all tab content
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.style.display = 'none';
    });

    // Remove active class from all mobile nav buttons
    const mobileNavBtns = document.querySelectorAll('.mobile-nav-btn');
    mobileNavBtns.forEach(btn => {
        btn.classList.remove('active');
    });

    // Show the selected tab content
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.style.display = 'block';
    }

    // Add active class to the clicked mobile nav button
    const activeBtn = document.querySelector(`[onclick="showMobileTab('${tabName}')"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

    // Load data for the selected tab
    if (tabName === 'products') {
        loadProducts();
    } else if (tabName === 'dashboard') {
        updateProductStats();
    } else if (tabName === 'customers') {
        loadCustomers();
    } else if (tabName === 'orders') {
        loadOrders();
    }
}

// Close mobile menu when clicking on nav links
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                closeMobileMenu();
            }
        });
    });
});

// Delete customer function
async function deleteCustomer(customerId) {
    // Store customer info for confirmation
    window.customerToDelete = {
        id: customerId,
        displayId: `KH${String(customerId).padStart(3, '0')}`
    };
    
    // Update modal content
    const deleteCustomerName = document.getElementById('deleteCustomerName');
    if (deleteCustomerName) {
        deleteCustomerName.textContent = `KH${String(customerId).padStart(3, '0')}`;
    }
    
    // Show delete confirmation modal
    const customerDeleteConfirmModal = document.getElementById('customerDeleteConfirmModal');
    if (customerDeleteConfirmModal) {
        customerDeleteConfirmModal.style.display = 'block';
    }
}

async function confirmDeleteCustomer() {
    const customerInfo = window.customerToDelete;
    if (!customerInfo) return;
    
    try {
        console.log('Deleting customer with ID:', customerInfo.id);
        const response = await fetch(`/api/customers/${customerInfo.id}`, {
            method: 'DELETE'
        });
        
        console.log('Delete response status:', response.status);
        
        if (response.ok) {
            showNotification(`Đã xóa khách hàng ${customerInfo.displayId} thành công!`, 'success');
            // Reload customers to update the list
            loadCustomers();
        } else {
            const data = await response.json();
            showNotification(`Lỗi: ${data.error}`, 'error');
        }
    } catch (error) {
        console.error('Error deleting customer:', error);
        showNotification('Lỗi kết nối khi xóa khách hàng', 'error');
    } finally {
        // Close modal
        const customerDeleteConfirmModal = document.getElementById('customerDeleteConfirmModal');
        if (customerDeleteConfirmModal) {
            customerDeleteConfirmModal.style.display = 'none';
        }
        window.customerToDelete = null;
    }
}

// Load customers from API
async function loadCustomers() {
    try {
        const token = localStorage.getItem('token'); // hoặc nơi bạn lưu token
        const response = await fetch('/api/users/customers', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        const data = await response.json();
        
        if (response.ok && data.customers) {
            displayCustomers(data.customers);
        } else {
            console.error('Failed to load customers:', data.error);
            showNotification('Không thể tải danh sách khách hàng', 'error');
        }
    } catch (error) {
        console.error('Error loading customers:', error);
        showNotification('Lỗi kết nối khi tải khách hàng', 'error');
    }
}

// Display customers in table
function displayCustomers(customers) {
    const customerTable = document.querySelector('#customers .table tbody');
    
    if (!customerTable) return;

    // Clear existing content
    customerTable.innerHTML = '';

    customers.forEach(customer => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>KH${String(customer.id).padStart(3, '0')}</td>
            <td>${customer.name || customer.full_name || 'N/A'}</td>
            <td>${customer.email || 'N/A'}</td>
            <td>${customer.phone || 'N/A'}</td>
            <td>${customer.address || 'N/A'}</td>
            <td>${customer.order_count || 0}</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="deleteCustomer(${customer.id})">
                    <i class="fas fa-trash"></i> Xóa
                </button>
            </td>
        `;
        customerTable.appendChild(row);
    });
}

// Load categories and brands for product forms
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        
        if (response.ok && Array.isArray(data.categories)) {
            const categorySelect = document.getElementById('productCategory');
            if (categorySelect) {
                categorySelect.innerHTML = '<option value="">Chọn loại sản phẩm</option>';
                data.categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.name;
                    categorySelect.appendChild(option);
                });
            }
        } else {
            console.error('Failed to load categories:', data.error);
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function loadBrands() {
    try {
        const response = await fetch('/api/brands');
        const data = await response.json();
        
        if (response.ok && data.brands) {
            const brandSelect = document.getElementById('productBrand');
            if (brandSelect) {
                brandSelect.innerHTML = '<option value="">Chọn thương hiệu</option>';
                data.brands.forEach(brand => {
                    const option = document.createElement('option');
                    option.value = brand.id;
                    option.textContent = brand.name;
                    brandSelect.appendChild(option);
                });
            }
        } else {
            console.error('Failed to load brands:', data.error);
        }
    } catch (error) {
        console.error('Error loading brands:', error);
    }
}

// Load form data when modal opens
function loadProductFormData() {
    loadCategories();
    loadBrands();
}

// Export functions for global use
window.loadProducts = loadProducts;
window.displayProducts = displayProducts;
window.changePage = changePage;
window.showTab = showTab;
window.showNotification = showNotification;
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;
window.showMobileTab = showMobileTab;
window.deleteCustomer = deleteCustomer;
window.loadCustomers = loadCustomers;
window.displayCustomers = displayCustomers;
window.loadCategories = loadCategories;
window.loadBrands = loadBrands;
window.loadProductFormData = loadProductFormData;

// Format Vietnamese address names
function formatVietnameseAddress(address) {
    if (!address) return 'N/A';
    
    // Common Vietnamese address mappings
    const addressMap = {
        'chauduc': 'Châu Đức',
        'châuđức': 'Châu Đức',
        'bariavungtau': 'Bà Rịa - Vũng Tàu',
        'bàriavũngtàu': 'Bà Rịa - Vũng Tàu',
        'hcm': 'TP. Hồ Chí Minh',
        'hochiminh': 'TP. Hồ Chí Minh',
        'hanoi': 'Hà Nội',
        'hànội': 'Hà Nội',
        'danang': 'Đà Nẵng',
        'đànẵng': 'Đà Nẵng'
    };
    
    // Convert to lowercase for comparison
    const lowerAddress = address.toLowerCase();
    
    // Check if we have a mapping
    for (const [key, value] of Object.entries(addressMap)) {
        if (lowerAddress.includes(key)) {
            return value;
        }
    }
    
    // If no mapping found, try to capitalize properly
    return address.charAt(0).toUpperCase() + address.slice(1).toLowerCase();
}

// Load orders from API
async function loadOrders() {
    try {
        console.log('Loading orders...');
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found');
            return;
        }
        
        const res = await fetch('/api/admin/orders', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('Response status:', res.status);
        const data = await res.json();
        console.log('Orders data:', data);
        console.log('Orders array:', data.orders);
        console.log('Orders count:', data.orders ? data.orders.length : 0);
        
        // Store orders globally for detail view
        window.currentOrders = data.orders || [];
        
        // Render cho bảng Quản lý đơn hàng
        const ordersTbody = document.getElementById('ordersTableBody');
        console.log('Found orders tbody element:', ordersTbody);
        
        // Render cho bảng Dashboard
        const dashboardTbody = document.getElementById('dashboardOrdersTableBody');
        console.log('Found dashboard tbody element:', dashboardTbody);
        
        if (!ordersTbody && !dashboardTbody) {
            console.error('No orders table body found!');
            return;
        }
        
        // Tạo HTML cho mỗi đơn hàng (có nút xóa/sửa trạng thái)
        const ordersHTML = data.orders.map((order, index) => {
            const d = new Date(order.order_date);
            const dateStr = d.toLocaleDateString('vi-VN');
            const totalStr = Number(order.total_amount).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
            let statusLabel = '';
            switch(order.status) {
                case 'pending': statusLabel = '<span class="status-badge status-pending">Chờ xử lý</span>'; break;
                case 'processing': statusLabel = '<span class="status-badge status-processing">Đang xử lý</span>'; break;
                case 'shipped': statusLabel = '<span class="status-badge status-shipped">Đã giao</span>'; break;
                case 'delivered': statusLabel = '<span class="status-badge status-delivered">Hoàn thành</span>'; break;
                case 'cancelled': statusLabel = '<span class="status-badge status-cancelled">Đã hủy</span>'; break;
                default: statusLabel = order.status;
            }
            // Nút đổi trạng thái đơn hàng (ví dụ: hoàn thành/hủy)
            let actionBtns = `<button class='btn btn-primary btn-sm btn-detail' onclick='showOrderDetail(${order.id})'>Chi tiết</button>`;
            if(order.status !== 'delivered' && order.status !== 'cancelled') {
                actionBtns += ` <button class='btn btn-success btn-sm' onclick='updateOrderStatus(${order.id},"delivered")'>Hoàn thành</button>`;
                actionBtns += ` <button class='btn btn-danger btn-sm' onclick='deleteOrder(${order.id})'>Xóa</button>`;
            } else {
                actionBtns += ` <button class='btn btn-danger btn-sm' onclick='deleteOrder(${order.id})'>Xóa</button>`;
            }
            return `
                <tr>
                    <td>#DH${order.id.toString().padStart(3, '0')}</td>
                    <td>${dateStr}</td>
                    <td>
                        <div><strong>${order.customer_name || 'N/A'}</strong></div>
                        <div style="font-size: 12px; color: #666;">${order.customer_phone || 'N/A'}</div>
                        <div style="font-size: 12px; color: #666;">${order.customer_email || 'N/A'}</div>
                    </td>
                    <td>
                        <div>${order.customer_address || 'N/A'}</div>
                        <div style="font-size: 12px; color: #666;">${order.customer_district || ''}, ${order.customer_city || ''}</div>
                    </td>
                    <td>${order.items || 'N/A'}</td>
                    <td>${totalStr}</td>
                    <td>${statusLabel}</td>
                    <td>${actionBtns}</td>
                </tr>
            `;
        }).join('');
// Xóa đơn hàng (admin)
async function deleteOrder(orderId) {
    if (!confirm('Bạn có chắc chắn muốn xóa đơn hàng này?')) return;
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`/api/orders/${orderId}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (res.ok) {
            showNotification('Đã xóa đơn hàng thành công!', 'success');
            loadOrders();
        } else {
            const data = await res.json();
            showNotification('Lỗi: ' + (data.error || 'Không thể xóa đơn hàng'), 'error');
        }
    } catch (err) {
        showNotification('Lỗi kết nối khi xóa đơn hàng', 'error');
    }
}

// Cập nhật trạng thái đơn hàng (admin)
async function updateOrderStatus(orderId, status) {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        if (res.ok) {
            showNotification('Cập nhật trạng thái thành công!', 'success');
            loadOrders();
        } else {
            const data = await res.json();
            showNotification('Lỗi: ' + (data.error || 'Không thể cập nhật trạng thái'), 'error');
        }
    } catch (err) {
        showNotification('Lỗi kết nối khi cập nhật trạng thái', 'error');
    }
}

        // Tạo HTML cho dashboard (không có cột Ngày đặt)
        const dashboardHTML = data.orders.map((order, index) => {
            console.log(`Processing dashboard order ${index}:`, order);
            const d = new Date(order.order_date);
            const dateStr = d.toLocaleDateString('vi-VN');
            // Định dạng giá tiền kiểu VNĐ
            const totalStr = Number(order.total_amount).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
            let statusLabel = '';
            switch(order.status) {
                case 'pending': statusLabel = '<span class="status-badge status-pending">Chờ xử lý</span>'; break;
                case 'processing': statusLabel = '<span class="status-badge status-processing">Đang xử lý</span>'; break;
                case 'shipped': statusLabel = '<span class="status-badge status-shipped">Đã giao</span>'; break;
                case 'delivered': statusLabel = '<span class="status-badge status-delivered">Hoàn thành</span>'; break;
                case 'cancelled': statusLabel = '<span class="status-badge status-cancelled">Đã hủy</span>'; break;
                default: statusLabel = order.status;
            }
            return `
                <tr>
                    <td>#DH${order.id.toString().padStart(3, '0')}</td>
                    <td>
                        <div><strong>${order.customer_name || 'N/A'}</strong></div>
                        <div style="font-size: 12px; color: #666;">${order.customer_phone || 'N/A'}</div>
                    </td>
                    <td>${order.items || 'N/A'}</td>
                    <td>${totalStr}</td>
                    <td>${statusLabel}</td>
                    <td>
                        <button class="btn btn-primary btn-sm btn-detail" onclick="showOrderDetail(${order.id})">Chi tiết</button>
                    </td>
                </tr>
            `;
        }).join('');
        
        // Render vào bảng Quản lý đơn hàng
        if (ordersTbody) {
            ordersTbody.innerHTML = ordersHTML;
            console.log('Rendered orders to orders table');
        }
        
        // Render vào bảng Dashboard
        if (dashboardTbody) {
            dashboardTbody.innerHTML = dashboardHTML;
            console.log('Rendered orders to dashboard table');
        }
        
        // Render mobile cards cho dashboard
        const dashboardCardsContainer = document.querySelector('.dashboard-orders-cards');
        if (dashboardCardsContainer) {
            const mobileCardsHTML = data.orders.map((order, index) => {
                const totalStr = Number(order.total_amount).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
                let statusClass = '';
                let statusText = '';
                switch(order.status) {
                    case 'pending': 
                        statusClass = 'pending'; 
                        statusText = 'Chờ xử lý'; 
                        break;
                    case 'processing': 
                        statusClass = 'processing'; 
                        statusText = 'Đang xử lý'; 
                        break;
                    case 'shipped': 
                        statusClass = 'shipped'; 
                        statusText = 'Đã giao'; 
                        break;
                    case 'delivered': 
                        statusClass = 'completed'; 
                        statusText = 'Hoàn thành'; 
                        break;
                    case 'cancelled': 
                        statusClass = 'cancelled'; 
                        statusText = 'Đã hủy'; 
                        break;
                    default: 
                        statusClass = 'pending'; 
                        statusText = order.status;
                }
                return `
                    <div class="order-card">
                        <div class="order-row">
                            <span class="order-label">Mã đơn:</span>
                            <span class="order-value order-id">#DH${order.id.toString().padStart(3, '0')}</span>
                        </div>
                        <div class="order-row">
                            <span class="order-label">Khách hàng:</span>
                            <span class="order-value">${order.customer_name || 'N/A'}<br><small>${order.customer_phone || 'N/A'}</small><br><small>${order.customer_email || 'N/A'}</small></span>
                        </div>
                        <div class="order-row">
                            <span class="order-label">Địa chỉ:</span>
                            <span class="order-value">${order.customer_address || 'N/A'}<br><small>${formatVietnameseAddress(order.customer_district)}${order.customer_district && order.customer_city ? ', ' : ''}${formatVietnameseAddress(order.customer_city)}</small></span>
                        </div>
                        <div class="order-row">
                            <span class="order-label">Sản phẩm:</span>
                            <span class="order-value">${order.items || 'N/A'}</span>
                        </div>
                        <div class="order-row">
                            <span class="order-label">Tổng tiền:</span>
                            <span class="order-value">${totalStr}</span>
                        </div>
                        <div class="order-row">
                            <span class="order-label">Trạng thái:</span>
                            <span class="order-value">
                                <span class="order-status ${statusClass}">${statusText}</span>
                            </span>
                        </div>
                        <div class="order-actions">
                            <button class="btn btn-primary btn-sm" onclick="showOrderDetail(${order.id})">Chi tiết</button>
                        </div>
                    </div>
                `;
            }).join('');
            dashboardCardsContainer.innerHTML = mobileCardsHTML;
            console.log('Rendered mobile cards for dashboard orders');
        }
        
        // Render mobile cards cho orders page
        const ordersCardsContainer = document.querySelector('.orders-mobile-cards');
        if (ordersCardsContainer) {
            const ordersMobileCardsHTML = data.orders.map((order, index) => {
                const d = new Date(order.order_date);
                const dateStr = d.toLocaleDateString('vi-VN');
                const totalStr = Number(order.total_amount).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
                let statusClass = '';
                let statusText = '';
                switch(order.status) {
                    case 'pending': 
                        statusClass = 'pending'; 
                        statusText = 'Chờ xử lý'; 
                        break;
                    case 'processing': 
                        statusClass = 'processing'; 
                        statusText = 'Đang xử lý'; 
                        break;
                    case 'shipped': 
                        statusClass = 'shipped'; 
                        statusText = 'Đã giao'; 
                        break;
                    case 'delivered': 
                        statusClass = 'completed'; 
                        statusText = 'Hoàn thành'; 
                        break;
                    case 'cancelled': 
                        statusClass = 'cancelled'; 
                        statusText = 'Đã hủy'; 
                        break;
                    default: 
                        statusClass = 'pending'; 
                        statusText = order.status;
                }
                return `
                    <div class="order-card">
                        <div class="order-row">
                            <span class="order-label">Mã đơn:</span>
                            <span class="order-value order-id">#DH${order.id.toString().padStart(3, '0')}</span>
                        </div>
                        <div class="order-row">
                            <span class="order-label">Ngày đặt:</span>
                            <span class="order-value">${dateStr}</span>
                        </div>
                        <div class="order-row">
                            <span class="order-label">Khách hàng:</span>
                            <span class="order-value">${order.customer_name || 'N/A'}<br><small>${order.customer_phone || 'N/A'}</small><br><small>${order.customer_email || 'N/A'}</small></span>
                        </div>
                        <div class="order-row">
                            <span class="order-label">Địa chỉ:</span>
                            <span class="order-value">${order.customer_address || 'N/A'}</span>
                        </div>
                        <div class="order-row">
                            <span class="order-label">Quận/Huyện:</span>
                            <span class="order-value">${formatVietnameseAddress(order.customer_district)}</span>
                        </div>
                        <div class="order-row">
                            <span class="order-label">Tỉnh/Thành:</span>
                            <span class="order-value">${formatVietnameseAddress(order.customer_city)}</span>
                        </div>
                        <div class="order-row">
                            <span class="order-label">Sản phẩm:</span>
                            <span class="order-value">${order.items || 'N/A'}</span>
                        </div>
                        <div class="order-row">
                            <span class="order-label">Tổng tiền:</span>
                            <span class="order-value">${totalStr}</span>
                        </div>
                        <div class="order-row">
                            <span class="order-label">Trạng thái:</span>
                            <span class="order-value">
                                <span class="order-status ${statusClass}">${statusText}</span>
                            </span>
                        </div>
                        <div class="order-actions">
                            <button class="btn btn-primary btn-sm" onclick="showOrderDetail(${order.id})">Chi tiết</button>
                        </div>
                    </div>
                `;
            }).join('');
            ordersCardsContainer.innerHTML = ordersMobileCardsHTML;
            console.log('Rendered mobile cards for orders page');
        }
        
        console.log('Orders loaded successfully!');
        
    } catch (error) {
        console.error('Error loading orders:', error);
        const ordersTbody = document.getElementById('ordersTableBody');
        const dashboardTbody = document.getElementById('dashboardOrdersTableBody');
        
        if (ordersTbody) {
            ordersTbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #e74c3c;">Lỗi tải dữ liệu đơn hàng</td></tr>';
        }
        if (dashboardTbody) {
            dashboardTbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #e74c3c;">Lỗi tải dữ liệu đơn hàng</td></tr>';
        }
    }
}

window.loadOrders = loadOrders;

// Load brands data
async function loadBrands() {
    try {
        const response = await fetch('/api/brands');
        const data = await response.json();
        displayBrands(data.brands);
    } catch (error) {
        console.error('Error loading brands:', error);
        const brandsTbody = document.getElementById('brandsTableBody');
        if (brandsTbody) {
            brandsTbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #e74c3c;">Lỗi tải dữ liệu thương hiệu</td></tr>';
        }
    }
}

// Display brands in table
function displayBrands(brands) {
    const brandsTbody = document.getElementById('brandsTableBody');
    if (!brandsTbody) return;

    if (!Array.isArray(brands) || brands.length === 0) {
        brandsTbody.innerHTML = `
            <tr>
                <td colspan="3">
                    <div class="brand-empty">
                        <i class="fas fa-tag"></i>
                        <h3>Chưa có thương hiệu nào</h3>
                        <p>Bắt đầu bằng cách thêm thương hiệu đầu tiên của bạn</p>
                        <button class="add-brand-btn" onclick="openAddBrandModal()">
                            <i class="fas fa-plus"></i> Thêm thương hiệu đầu tiên
                        </button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    const brandsHTML = brands.map(brand => {
        return `
            <tr>
                <td><span class="brand-id">#${brand.id}</span></td>
                <td><span class="brand-name">${brand.name}</span></td>
                <td>
                    <div class="brand-actions">
                        <button class="btn btn-primary" onclick="editBrand(${brand.id}, '${brand.name}')">
                            <i class="fas fa-edit"></i> Sửa
                        </button>
                        <button class="btn btn-danger" onclick="deleteBrand(${brand.id}, '${brand.name}')">
                            <i class="fas fa-trash"></i> Xóa
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    brandsTbody.innerHTML = brandsHTML;
}

// Open add brand modal
function openAddBrandModal() {
    document.getElementById('addBrandModal').style.display = 'block';
}

// Edit brand function
function editBrand(brandId, brandName) {
    document.getElementById('editBrandId').value = brandId;
    document.getElementById('editBrandName').value = brandName;
    document.getElementById('editBrandModal').style.display = 'block';
}

// Delete brand function
function deleteBrand(brandId, brandName) {
    if (confirm(`Bạn có chắc chắn muốn xóa thương hiệu "${brandName}"?`)) {
        deleteBrandConfirm(brandId);
    }
}

// Add orders case to showTab function
const originalShowTab = window.showTab;
window.showTab = function(event, tabName) {
    originalShowTab(event, tabName);
    if (tabName === 'orders') {
        loadOrders();
    } else if (tabName === 'reports') {
        loadReports();
    } else if (tabName === 'brands') {
        loadBrands();
    }
};

// Add orders case to showMobileTab function  
const originalShowMobileTab = window.showMobileTab;
window.showMobileTab = function(tabName) {
    originalShowMobileTab(tabName);
    if (tabName === 'orders') {
        loadOrders();
    } else if (tabName === 'reports') {
        loadReports();
    } else if (tabName === 'brands') {
        loadBrands();
    }
}; 

// Load reports data from API
async function loadReports() {
    console.log('Loading reports data...');
    try {
        // Load dữ liệu cho 2 biểu đồ dashboard
        const token = localStorage.getItem('token');
        // Pie chart: doanh thu theo thương hiệu
        const pieRes = await fetch('/api/reports/brand-revenue', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const pieData = await pieRes.json();
        if (pieRes.ok) {
            renderPieChart(pieData.brands);
        } else {
            console.error('Failed to load brand revenue data:', pieData.error);
        }
        // Line chart: doanh thu theo ngày
        const lineRes = await fetch('/api/reports/daily-revenue', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const lineData = await lineRes.json();
        if (lineRes.ok) {
            renderLineChart(lineData.daily);
            displayDailyRevenue(lineData.daily);
        } else {
            console.error('Failed to load daily revenue data:', lineData.error);
        }
        
    } catch (error) {
        console.error('Error loading reports:', error);
        showNotification('Lỗi kết nối khi tải báo cáo', 'error');
    }
}

// Display report summary data
function displayReportSummary(data) {
    // Update dashboard stats
    const revenueElement = document.querySelector('#dashboard .stat-card:nth-child(2) .stat-content h3');
    const ordersElement = document.querySelector('#dashboard .stat-card:nth-child(1) .stat-content h3');
    const customersElement = document.querySelector('#dashboard .stat-card:nth-child(4) .stat-content h3');
    const stockElement = document.querySelector('#dashboard .stat-card:nth-child(3) .stat-content h3');
    
    if (revenueElement) {
        revenueElement.textContent = formatPrice(data.revenue);
    }
    if (ordersElement) {
        ordersElement.textContent = data.order_count || 0;
    }
    if (customersElement) {
        customersElement.textContent = data.new_customers || 0;
    }
    if (stockElement) {
        stockElement.textContent = data.stock_count || 0;
    }
    // Vẽ biểu đồ dashboard
    renderDashboardChart({
        order_count: data.order_count,
        revenue: data.revenue,
        stock_count: data.stock_count,
        new_customers: data.new_customers
    });
    
    // Update reports page stats using correct IDs
    const reportsRevenueElement = document.getElementById('revenue');
    const reportsOrdersElement = document.getElementById('order_count');
    const reportsCustomersElement = document.getElementById('new_customers');
    const topProductElement = document.getElementById('top_product');
    
    if (reportsRevenueElement) {
        reportsRevenueElement.textContent = formatPrice(data.revenue);
    }
    if (reportsOrdersElement) {
        reportsOrdersElement.textContent = data.order_count || 0;
    }
    if (reportsCustomersElement) {
        reportsCustomersElement.textContent = data.new_customers || 0;
    }
    if (topProductElement) {
        topProductElement.textContent = data.top_product || 'Chưa có dữ liệu';
    }
}

// Display daily revenue in table
function displayDailyRevenue(dailyData) {
    const tableBody = document.querySelector('#dailyRevenueTable tbody');
    if (!tableBody) return;
    
    const tableHTML = dailyData.map(day => {
        const date = new Date(day.date);
        const formattedDate = date.toLocaleDateString('vi-VN');
        return `
            <tr>
                <td>${formattedDate}</td>
                <td>${formatPrice(day.revenue)}</td>
            </tr>
        `;
    }).join('');
    
    tableBody.innerHTML = tableHTML;
}

// Add brand form submission
const addBrandForm = document.getElementById('addBrandForm');
if (addBrandForm) {
    addBrandForm.onsubmit = async function(e) {
        e.preventDefault();
        const brandName = document.getElementById('brandName').value;
        
        try {
            const response = await fetch('/api/brands', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: brandName
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                showNotification('Thêm thương hiệu thành công!', 'success');
                closeModal('addBrandModal');
                addBrandForm.reset();
                loadBrands(); // Reload brands list
            } else {
                showNotification('Lỗi: ' + (result.error || 'Không thể thêm thương hiệu'), 'error');
            }
        } catch (error) {
            console.error('Error adding brand:', error);
            showNotification('Lỗi kết nối khi thêm thương hiệu', 'error');
        }
    };
}

// Edit brand form submission
const editBrandForm = document.getElementById('editBrandForm');
if (editBrandForm) {
    editBrandForm.onsubmit = async function(e) {
        e.preventDefault();
        const brandId = document.getElementById('editBrandId').value;
        const brandName = document.getElementById('editBrandName').value;
        
        try {
            const response = await fetch(`/api/brands/${brandId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: brandName
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                showNotification('Cập nhật thương hiệu thành công!', 'success');
                closeModal('editBrandModal');
                loadBrands(); // Reload brands list
            } else {
                showNotification('Lỗi: ' + (result.error || 'Không thể cập nhật thương hiệu'), 'error');
            }
        } catch (error) {
            console.error('Error updating brand:', error);
            showNotification('Lỗi kết nối khi cập nhật thương hiệu', 'error');
        }
    };
}

// Delete brand confirmation
async function deleteBrandConfirm(brandId) {
    try {
        const response = await fetch(`/api/brands/${brandId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification('Xóa thương hiệu thành công!', 'success');
            loadBrands(); // Reload brands list
        } else {
            showNotification('Lỗi: ' + (result.error || 'Không thể xóa thương hiệu'), 'error');
        }
    } catch (error) {
        console.error('Error deleting brand:', error);
        showNotification('Lỗi kết nối khi xóa thương hiệu', 'error');
    }
}

// Function to show order details
function showOrderDetail(orderId) {
    // Find the order in the current data
    const order = window.currentOrders ? window.currentOrders.find(o => o.id === orderId) : null;
    
    if (!order) {
        showNotification('Không thể tìm thấy thông tin đơn hàng', 'error');
        return;
    }
    
    const orderDate = new Date(order.order_date).toLocaleDateString('vi-VN');
    const totalStr = Number(order.total_amount).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
    
    let statusText = '';
    switch(order.status) {
        case 'pending': statusText = 'Chờ xử lý'; break;
        case 'processing': statusText = 'Đang xử lý'; break;
        case 'shipped': statusText = 'Đã giao'; break;
        case 'delivered': statusText = 'Hoàn thành'; break;
        case 'cancelled': statusText = 'Đã hủy'; break;
        default: statusText = order.status;
    }
    
    const detailHTML = `
        <div style="padding: 20px;">
            <div style="margin-bottom: 20px;">
                <h4 style="color: #666; margin-bottom: 10px;">Thông tin khách hàng</h4>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                    <p><strong>Tên:</strong> ${order.customer_name || 'N/A'}</p>
                    <p><strong>Số điện thoại:</strong> ${order.customer_phone || 'N/A'}</p>
                    <p><strong>Email:</strong> ${order.customer_email || 'N/A'}</p>
                    <p><strong>Địa chỉ:</strong> ${order.customer_address || 'N/A'}</p>
                    <p><strong>Quận/Huyện:</strong> ${order.customer_district || 'N/A'}</p>
                    <p><strong>Tỉnh/Thành phố:</strong> ${order.customer_city || 'N/A'}</p>
                    <p><strong>Ghi chú:</strong> ${order.customer_note || 'Không có'}</p>
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h4 style="color: #666; margin-bottom: 10px;">Thông tin đơn hàng</h4>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                    <p><strong>Ngày đặt:</strong> ${orderDate}</p>
                    <p><strong>Trạng thái:</strong> ${statusText}</p>
                    <p><strong>Phương thức thanh toán:</strong> ${order.payment_method || 'N/A'}</p>
                    <p><strong>Sản phẩm:</strong> ${order.items || 'N/A'}</p>
                    <p><strong>Tổng tiền:</strong> ${totalStr}</p>
                </div>
            </div>
        </div>
    `;
    
    // Hiển thị modal chi tiết đơn hàng
    const modalContent = document.getElementById('orderDetailContent');
    if (modalContent) {
        modalContent.innerHTML = detailHTML;
        document.getElementById('orderDetailModal').style.display = 'block';
    } else {
        // Fallback nếu không tìm thấy modal
        showNotification(detailHTML.replace(/<[^>]*>/g, ''), 'info');
    }
} 

// Hàm load lại danh sách mã giảm giá
async function loadPromotions() {
  try {
    const response = await fetch('/api/admin/discount-codes', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const data = await response.json();
    if (response.ok && data.discountCodes) {
      // Render bảng (desktop)
      const tbody = document.getElementById('discountCodesTableBody');
      if (tbody) {
        tbody.innerHTML = '';
        data.discountCodes.forEach(code => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${code.code}</td>
            <td>${code.description || '-'}</td>
            <td>${code.discount_type === 'percentage' ? 'Phần trăm' : 'Số tiền'}</td>
            <td>${code.discount_type === 'percentage' ? code.discount_value + '%' : Number(code.discount_value).toLocaleString('vi-VN') + 'đ'}</td>
            <td>${Number(code.min_order_amount).toLocaleString('vi-VN')}đ</td>
            <td>${code.used_count}/${code.max_uses || '∞'}</td>
            <td><span class="status-badge ${code.is_active ? 'status-delivered' : 'status-cancelled'}">${code.is_active ? 'Hoạt động' : 'Tạm dừng'}</span></td>
            <td>${code.valid_until ? new Date(code.valid_until).toLocaleDateString('vi-VN') : 'Không giới hạn'}</td>
            <td style="text-align:center; white-space:nowrap; min-width:120px;">
              <button class="btn btn-warning btn-sm" onclick="editDiscountCode(${code.id})" 
                data-code="${code.code}"
                data-description="${code.description || ''}"
                data-type="${code.discount_type}"
                data-value="${code.discount_value}"
                data-min="${code.min_order_amount}"
                data-max="${code.max_uses || ''}"
                data-valid="${code.valid_until || ''}"
                data-active="${code.is_active}">Sửa</button>
              <button class="btn btn-danger btn-sm" onclick="deleteDiscountCode(${code.id})">Xóa</button>
            </td>
          `;
          tbody.appendChild(row);
        });
      }
      // Render card (mobile)
      const cardsContainer = document.getElementById('promotionCardsContainer');
      if (cardsContainer) {
        cardsContainer.innerHTML = '';
        data.discountCodes.forEach(code => {
          const card = document.createElement('div');
          card.className = 'promotion-card';
          card.innerHTML = `
            <div class="promo-row"><span class="promo-label">Mã:</span><span class="promo-value">${code.code}</span></div>
            <div class="promo-row"><span class="promo-label">Mô tả:</span><span class="promo-value">${code.description || '-'}</span></div>
            <div class="promo-row"><span class="promo-label">Loại:</span><span class="promo-value">${code.discount_type === 'percentage' ? 'Phần trăm' : 'Số tiền'}</span></div>
            <div class="promo-row"><span class="promo-label">Giá trị:</span><span class="promo-value">${code.discount_type === 'percentage' ? code.discount_value + '%' : Number(code.discount_value).toLocaleString('vi-VN') + 'đ'}</span></div>
            <div class="promo-row"><span class="promo-label">Tối thiểu:</span><span class="promo-value">${Number(code.min_order_amount).toLocaleString('vi-VN')}đ</span></div>
            <div class="promo-row"><span class="promo-label">Lượt dùng:</span><span class="promo-value">${code.used_count}/${code.max_uses || '∞'}</span></div>
            <div class="promo-row"><span class="promo-label">Trạng thái:</span><span class="promo-value"><span class="status-badge ${code.is_active ? 'status-delivered' : 'status-cancelled'}">${code.is_active ? 'Hoạt động' : 'Tạm dừng'}</span></span></div>
            <div class="promo-row"><span class="promo-label">HSD:</span><span class="promo-value">${code.valid_until ? new Date(code.valid_until).toLocaleDateString('vi-VN') : 'Không giới hạn'}</span></div>
            <div class="promo-actions">
              <button class="btn btn-warning btn-sm" onclick="editDiscountCode(${code.id})"
                data-code="${code.code}"
                data-description="${code.description || ''}"
                data-type="${code.discount_type}"
                data-value="${code.discount_value}"
                data-min="${code.min_order_amount}"
                data-max="${code.max_uses || ''}"
                data-valid="${code.valid_until || ''}"
                data-active="${code.is_active}"><i class='fas fa-edit'></i> Sửa</button>
              <button class="btn btn-danger btn-sm" onclick="deleteDiscountCode(${code.id})"><i class='fas fa-trash'></i> Xóa</button>
            </div>
          `;
          cardsContainer.appendChild(card);
        });
      }
    } else {
      showNotification('Không thể tải danh sách mã giảm giá', 'error');
    }
  } catch (error) {
    showNotification('Lỗi kết nối khi tải mã giảm giá', 'error');
  }
} 

// Hàm đăng xuất cho mobile
function logoutAdmin() {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = 'login.html';
    }
} 
