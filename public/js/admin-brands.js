// admin-brands.js
// Logic cho trang Quản lý thương hiệu

document.addEventListener('DOMContentLoaded', function() {
    // TODO: Gọi API lấy danh sách thương hiệu và render bảng
    // Ví dụ dữ liệu mẫu:
    const brands = [
        { id: 'BR001', name: 'Casio' },
        { id: 'BR002', name: 'Seiko' }
    ];
    const tbody = document.getElementById('brandsTableBody');
    function renderTable(data) {
        tbody.innerHTML = '';
        data.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.id}</td>
                <td>${item.name}</td>
                <td><button class="btn btn-primary">Sửa</button> <button class="btn btn-danger">Xóa</button></td>
            `;
            tbody.appendChild(tr);
        });
    }
    renderTable(brands);
    // TODO: Thêm logic modal thêm/sửa/xóa thương hiệu
});