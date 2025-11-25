// admin-stock.js
// Tách biệt hoàn toàn: lấy dữ liệu tồn kho thật từ API

let stockProducts = [];

// Lấy dữ liệu tồn kho từ API
async function loadStock() {
    try {
        const response = await fetch('/api/products');
        const data = await response.json();
        if (response.ok && data.products) {
            stockProducts = data.products;
            displayStock(stockProducts);
        } else {
            showNotification('Không thể tải dữ liệu tồn kho', 'error');
        }
    } catch (error) {
        showNotification('Lỗi kết nối khi tải tồn kho', 'error');
    }
}

// Hiển thị dữ liệu tồn kho ra bảng
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
                <button class="btn btn-edit btn-sm" onclick="openUpdateStockModal(${product.id})">Cập nhật</button>
            </td>
        `;
        stockTbody.appendChild(row);
    });
}

// Tìm kiếm tồn kho
document.addEventListener('DOMContentLoaded', function() {
    loadStock();
    const searchBox = document.querySelector('.search-box input');
    if (searchBox) {
        searchBox.addEventListener('input', function() {
            const keyword = this.value.toLowerCase();
            const filtered = stockProducts.filter(product =>
                (product.name && product.name.toLowerCase().includes(keyword)) ||
                (String(product.id).toLowerCase().includes(keyword)) ||
                (product.brand_name && product.brand_name.toLowerCase().includes(keyword))
            );
            displayStock(filtered);
        });
    }
});

// Modal cập nhật tồn kho (chỉ hiển thị, chưa cập nhật thật)
window.openUpdateStockModal = function(productId) {
    const modal = document.getElementById('updateStockModal');
    const product = stockProducts.find(item => item.id === productId);
    if (!product) return;
    document.getElementById('updateStockProductId').value = product.id;
    document.getElementById('updateStockProductName').value = product.name;
    document.getElementById('updateStockQuantity').value = product.stock;
    modal.style.display = 'block';
};

window.closeModal = function(modalId) {
    document.getElementById(modalId).style.display = 'none';
};

// (Optional) Xử lý cập nhật tồn kho thật khi submit form
document.getElementById('updateStockForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const productId = document.getElementById('updateStockProductId').value;
    const newStock = parseInt(document.getElementById('updateStockQuantity').value, 10);
    // Gọi API cập nhật tồn kho nếu muốn cập nhật thật
    try {
        const response = await fetch(`/api/products/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ stock: newStock })
        });
        const result = await response.json();
        if (response.ok) {
            showNotification('Cập nhật tồn kho thành công!', 'success');
            // Reload lại dữ liệu tồn kho
            loadStock();
            window.closeModal('updateStockModal');
        } else {
            showNotification('Lỗi: ' + (result.error || 'Không thể cập nhật tồn kho'), 'error');
        }
    } catch (error) {
        showNotification('Lỗi kết nối khi cập nhật tồn kho', 'error');
    }
});

// Đóng modal khi click ra ngoài
window.onclick = function(event) {
    const modal = document.getElementById('updateStockModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};

// Hàm thông báo đơn giản
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
        case 'success': notification.style.background = '#27ae60'; break;
        case 'error': notification.style.background = '#e74c3c'; break;
        case 'warning': notification.style.background = '#f39c12'; break;
        default: notification.style.background = '#3498db'; break;
    }

    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}
