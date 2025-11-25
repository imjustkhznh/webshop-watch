// admin-products.js
// Logic cho trang Quản lý sản phẩm

document.addEventListener('DOMContentLoaded', function() {
    // TODO: Gọi API lấy danh sách sản phẩm và render bảng
    // Ví dụ dữ liệu mẫu:
    const products = [
        { id: 'SP001', name: 'Đồng hồ Casio A168', category: 'Nam', brand: 'Casio', price: 1200000, stock: 12, status: 'Còn hàng' },
        { id: 'SP002', name: 'Đồng hồ Seiko 5', category: 'Nam', brand: 'Seiko', price: 3500000, stock: 0, status: 'Hết hàng' }
    ];
    const tbody = document.querySelector('tbody');
    function renderTable(data) {
        tbody.innerHTML = '';
        data.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.id}</td>
                <td>${item.name}</td>
                <td>${item.category}</td>
                <td>${item.brand}</td>
                <td>${item.price.toLocaleString()}₫</td>
                <td>${item.stock}</td>
                <td>${item.status}</td>
                <td><button class="btn btn-primary">Sửa</button> <button class="btn btn-danger">Xóa</button></td>
            `;
            tbody.appendChild(tr);
        });
    }
    renderTable(products);
    // TODO: Thêm logic tìm kiếm, phân trang, modal thêm/sửa/xóa sản phẩm
});