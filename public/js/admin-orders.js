// admin-orders.js
// Logic cho trang Quản lý đơn hàng

document.addEventListener('DOMContentLoaded', function () {
    // TODO: Gọi API lấy danh sách đơn hàng và render bảng
    // Ví dụ dữ liệu mẫu:
    const orders = [
        { id: 'DH001', date: '2025-11-25', customer: 'Nguyễn Văn A', address: 'Hà Nội', products: 'Casio A168', total: 1200000, status: 'Đã giao' },
        { id: 'DH002', date: '2025-11-24', customer: 'Trần Thị B', address: 'TP.HCM', products: 'Seiko 5', total: 3500000, status: 'Đang xử lý' }
    ];
    const tbody = document.getElementById('ordersTableBody');
    function renderTable(data) {
        tbody.innerHTML = '';
        data.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.id}</td>
                <td>${item.date}</td>
                <td>${item.customer}</td>
                <td>${item.address}</td>
                <td>${item.products}</td>
                <td>${item.total.toLocaleString()}₫</td>
                <td>${item.status}</td>
                <td><button class="btn btn-primary">Chi tiết</button></td>
            `;
            tbody.appendChild(tr);
        });
    }
    renderTable(orders);
    // TODO: Thêm logic tìm kiếm, modal chi tiết đơn hàng
});