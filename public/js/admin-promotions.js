// admin-promotions.js
// Logic cho trang Quản lý mã giảm giá

document.addEventListener('DOMContentLoaded', function() {
    // TODO: Gọi API lấy danh sách mã giảm giá và render bảng
    // Ví dụ dữ liệu mẫu:
    const promotions = [
        { code: 'SALE10', desc: 'Giảm 10%', type: 'Phần trăm', value: 10, min: 500000, uses: 5, status: 'Còn hạn', expiry: '2025-12-31' },
        { code: 'WELCOME50', desc: 'Giảm 50k', type: 'Số tiền', value: 50000, min: 0, uses: 0, status: 'Hết hạn', expiry: '2025-10-01' }
    ];
    const tbody = document.getElementById('discountCodesTableBody');
    function renderTable(data) {
        tbody.innerHTML = '';
        data.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.code}</td>
                <td>${item.desc}</td>
                <td>${item.type}</td>
                <td>${item.value}</td>
                <td>${item.min.toLocaleString()}₫</td>
                <td>${item.uses}</td>
                <td>${item.status}</td>
                <td>${item.expiry}</td>
                <td><button class="btn btn-primary">Sửa</button> <button class="btn btn-danger">Xóa</button></td>
            `;
            tbody.appendChild(tr);
        });
    }
    renderTable(promotions);
    // TODO: Thêm logic modal thêm/sửa/xóa mã giảm giá
});