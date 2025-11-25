// admin-stock.js
// Logic cho trang Quản lý tồn kho

document.addEventListener('DOMContentLoaded', function() {
    // Lấy dữ liệu tồn kho từ API hoặc backend (giả lập dữ liệu mẫu)
    const stockData = [
        { id: 'SP001', name: 'Đồng hồ Casio A168', brand: 'Casio', stock: 12, status: 'Còn hàng' },
        { id: 'SP002', name: 'Đồng hồ Seiko 5', brand: 'Seiko', stock: 0, status: 'Hết hàng' },
        { id: 'SP003', name: 'Đồng hồ Orient Bambino', brand: 'Orient', stock: 5, status: 'Còn hàng' }
    ];

    const stockTableBody = document.getElementById('stockTableBody');
    const searchBox = document.querySelector('.search-box input');

    function renderStockTable(data) {
        stockTableBody.innerHTML = '';
        data.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.id}</td>
                <td>${item.name}</td>
                <td>${item.brand}</td>
                <td>${item.stock}</td>
                <td>${item.status}</td>
                <td><button class="btn btn-primary" onclick="openUpdateStockModal('${item.id}')">Cập nhật</button></td>
            `;
            stockTableBody.appendChild(tr);
        });
    }

    renderStockTable(stockData);

    // Tìm kiếm sản phẩm tồn kho
    searchBox.addEventListener('input', function() {
        const keyword = this.value.toLowerCase();
        const filtered = stockData.filter(item =>
            item.name.toLowerCase().includes(keyword) ||
            item.id.toLowerCase().includes(keyword) ||
            item.brand.toLowerCase().includes(keyword)
        );
        renderStockTable(filtered);
    });

    // Modal cập nhật tồn kho
    window.openUpdateStockModal = function(productId) {
        const modal = document.getElementById('updateStockModal');
        const product = stockData.find(item => item.id === productId);
        document.getElementById('updateStockProductId').value = product.id;
        document.getElementById('updateStockProductName').value = product.name;
        document.getElementById('updateStockQuantity').value = product.stock;
        modal.style.display = 'block';
    };

    window.closeModal = function(modalId) {
        document.getElementById(modalId).style.display = 'none';
    };

    document.getElementById('updateStockForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const productId = document.getElementById('updateStockProductId').value;
        const newStock = parseInt(document.getElementById('updateStockQuantity').value, 10);
        const product = stockData.find(item => item.id === productId);
        if (product) {
            product.stock = newStock;
            product.status = newStock > 0 ? 'Còn hàng' : 'Hết hàng';
            renderStockTable(stockData);
        }
        window.closeModal('updateStockModal');
    });

    // Đóng modal khi click ra ngoài
    window.onclick = function(event) {
        const modal = document.getElementById('updateStockModal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
});
