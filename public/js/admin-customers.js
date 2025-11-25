// admin-customers.js
// Logic cho trang Quản lý khách hàng

document.addEventListener('DOMContentLoaded', function() {
    // TODO: Gọi API lấy danh sách khách hàng và render bảng
    // Ví dụ dữ liệu mẫu:
    const customers = [
        { id: 'KH001', name: 'Nguyễn Văn A', email: 'a@gmail.com', phone: '0901234567', address: 'Hà Nội', orders: 3 },
        { id: 'KH002', name: 'Trần Thị B', email: 'b@gmail.com', phone: '0912345678', address: 'TP.HCM', orders: 1 }
    ];
    const tbody = document.querySelector('tbody');
    function renderTable(data) {
        tbody.innerHTML = '';
        data.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.id}</td>
                <td>${item.name}</td>
                <td>${item.email}</td>
                <td>${item.phone}</td>
                <td>${item.address}</td>
                <td>${item.orders}</td>
                <td><button class="btn btn-primary">Chi tiết</button></td>
            `;
            tbody.appendChild(tr);
        });
    }
    renderTable(customers);
    // TODO: Thêm logic tìm kiếm, modal chi tiết/sửa khách hàng
});