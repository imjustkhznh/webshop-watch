// admin-products.js
// Logic cho trang Quản lý sản phẩm

document.addEventListener('DOMContentLoaded', function() {
    // Lấy danh sách sản phẩm từ API và render bảng
    const tbody = document.querySelector('tbody');

    // Lưu danh sách sản phẩm để tra cứu khi sửa / xóa
    let productList = [];
    let currentDeleteProductId = null;

    function renderTable(data) {
        tbody.innerHTML = '';
        data.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.id}</td>
                <td>${item.name}</td>
                <td>${item.category_name || item.category || ''}</td>
                <td>${item.brand_name || item.brand || ''}</td>
                <td>${item.price ? item.price.toLocaleString() + '₫' : ''}</td>
                <td>${item.stock ?? ''}</td>
                <td>${item.status || (item.stock > 0 ? 'Còn hàng' : 'Hết hàng')}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editProduct('${item.id}')">Sửa</button>
                    <button class="btn btn-sm btn-danger" onclick="openDeleteProductModal('${item.id}')">Xóa</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Load brands và categories để điền select
    async function loadBrands() {
        const select = document.getElementById('productBrand');
        if (!select) return;
        try {
            const res = await fetch('/api/brands');
            if (!res.ok) throw new Error('Không thể lấy danh sách thương hiệu');
            const data = await res.json();
            // API trả về { brands: [...] } hoặc array trực tiếp, cố gắng hỗ trợ cả 2
            const brands = Array.isArray(data) ? data : (data.brands || data);
            select.innerHTML = '<option value="">Chọn thương hiệu</option>';
            brands.forEach(b => {
                const opt = document.createElement('option');
                opt.value = b.id;
                opt.textContent = b.name;
                select.appendChild(opt);
            });
        } catch (err) {
            console.warn('loadBrands error', err);
        }
    }

    async function loadCategories() {
        const select = document.getElementById('productCategory');
        if (!select) return;
        try {
            const res = await fetch('/api/categories');
            if (!res.ok) throw new Error('Không thể lấy danh sách loại sản phẩm');
            const data = await res.json();
            const categories = Array.isArray(data) ? data : (data.categories || data);
            select.innerHTML = '<option value="">Chọn loại</option>';
            categories.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = c.name;
                select.appendChild(opt);
            });
        } catch (err) {
            console.warn('loadCategories error', err);
        }
    }

    const addProductForm = document.getElementById('addProductForm');
    const submitBtn = document.getElementById('submitProductBtn');

    // Hàm chuẩn bị form ở chế độ thêm mới
    function resetProductForm() {
        if (!addProductForm) return;
        addProductForm.reset();
        addProductForm.dataset.mode = 'create';
        addProductForm.dataset.productId = '';
        const preview = document.getElementById('currentImagePreview');
        if (preview) preview.innerHTML = '';
        if (submitBtn) submitBtn.textContent = 'Thêm sản phẩm';
    }

    // Hàm mở modal thêm sản phẩm (được gọi từ HTML)
    function openAddProductModal() {
        // Đảm bảo select brand/category đã có dữ liệu
        Promise.all([loadBrands(), loadCategories()]).finally(() => {
            resetProductForm();
            openModal('addProductModal');
        });
    }
    window.openAddProductModal = openAddProductModal;

    // Sửa sản phẩm - chuyển sang async để đảm bảo select đã được load
    async function editProduct(id) {
        const product = productList.find(p => p.id == id);
        if (!product) return alert('Không tìm thấy sản phẩm!');
        // Đảm bảo các select đã có option
        await Promise.all([loadBrands(), loadCategories()]);
        // Mở modal và điền thông tin sản phẩm vào form
        openModal('addProductModal');
        document.getElementById('productName').value = product.name || '';
        document.getElementById('productBrand').value = product.brand_id || product.brand || '';
        document.getElementById('productCategory').value = product.category_id || product.category || '';
        document.getElementById('productPrice').value = product.price || '';
        document.getElementById('productStock').value = product.stock || '';
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productImage').value = product.image_url || '';
        // Hiển thị preview ảnh nếu có
        const preview = document.getElementById('currentImagePreview');
        if (product.image_url) {
            preview.innerHTML = `<img src="${product.image_url}" alt="Ảnh sản phẩm" style="max-width:120px;max-height:120px;">`;
        } else {
            preview.innerHTML = '';
        }
        // Đặt form ở chế độ cập nhật
        if (addProductForm) {
            addProductForm.dataset.mode = 'edit';
            addProductForm.dataset.productId = id;
        }
        if (submitBtn) {
            submitBtn.textContent = 'Cập nhật sản phẩm';
        }
    }
    window.editProduct = editProduct;

    // Mở modal xác nhận xóa sản phẩm
    function openDeleteProductModal(id) {
        const product = productList.find(p => p.id == id);
        if (!product) return alert('Không tìm thấy sản phẩm!');
        currentDeleteProductId = id;
        const nameElem = document.getElementById('deleteProductName');
        if (nameElem) {
            nameElem.textContent = `Bạn đang xóa: ${product.name}`;
        }
        openModal('deleteConfirmModal');
    }
    window.openDeleteProductModal = openDeleteProductModal;

    async function updateProduct(id) {
        // Lấy dữ liệu từ form
        const name = document.getElementById('productName').value.trim();
        const brand_id = document.getElementById('productBrand').value;
        const category_id = document.getElementById('productCategory').value;
        const price = document.getElementById('productPrice').value;
        const stock = document.getElementById('productStock').value;
        const description = document.getElementById('productDescription').value;
        const image_url = document.getElementById('productImage').value;
        // Gửi request cập nhật
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`/api/products/${id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ name, brand_id, category_id, price, stock, description, image_url })
            });
            if (res.status === 401) return alert('Bạn cần đăng nhập/đăng nhập lại để thực hiện hành động này.');
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Cập nhật thất bại');
            }
            closeModal('addProductModal');
            fetchProducts();
        } catch (err) {
            alert(err.message);
        }
    }

    // Thêm mới sản phẩm
    async function createProduct() {
        const name = document.getElementById('productName').value.trim();
        const brand_id = document.getElementById('productBrand').value;
        const category_id = document.getElementById('productCategory').value;
        const price = document.getElementById('productPrice').value;
        const stock = document.getElementById('productStock').value;
        const description = document.getElementById('productDescription').value;
        const image_url = document.getElementById('productImage').value;

        if (!name || !brand_id || !category_id || !price || !stock) {
            alert('Vui lòng nhập đầy đủ các trường bắt buộc.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch('/api/products', {
                method: 'POST',
                headers,
                body: JSON.stringify({ name, brand_id, category_id, price, stock, description, image_url })
            });

            if (res.status === 401) {
                alert('Bạn cần đăng nhập/đăng nhập lại để thực hiện hành động này.');
                return;
            }

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.error || 'Thêm sản phẩm thất bại');
            }

            closeModal('addProductModal');
            resetProductForm();
            fetchProducts();
        } catch (err) {
            alert(err.message);
        }
    }

    // Bắt sự kiện submit form để phân biệt thêm mới / cập nhật
    if (addProductForm) {
        addProductForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const mode = addProductForm.dataset.mode || 'create';
            if (mode === 'edit' && addProductForm.dataset.productId) {
                updateProduct(addProductForm.dataset.productId);
            } else {
                createProduct();
            }
        });
    }

    // Gọi lại fetchProducts và lưu productList
    async function fetchProducts() {
        try {
            const res = await fetch('/api/products');
            if (!res.ok) throw new Error('Lỗi khi lấy danh sách sản phẩm');
            const data = await res.json();
            if (!Array.isArray(data.products)) throw new Error('Dữ liệu trả về không hợp lệ');
            productList = data.products;
            renderTable(productList);
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan=\"8\" style=\"color:red\">${err.message}</td></tr>`;
        }
    }

    // Xác nhận xóa sản phẩm (gọi từ nút trong modal)
    async function confirmDeleteProduct() {
        if (!currentDeleteProductId) {
            return closeModal('deleteConfirmModal');
        }
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`/api/products/${currentDeleteProductId}`, {
                method: 'DELETE',
                headers
            });
            if (res.status === 401) {
                alert('Bạn cần đăng nhập/đăng nhập lại để thực hiện hành động này.');
                return;
            }
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Xóa sản phẩm thất bại');
            }
            closeModal('deleteConfirmModal');
            currentDeleteProductId = null;
            fetchProducts();
        } catch (err) {
            alert(err.message);
        }
    }
    window.confirmDeleteProduct = confirmDeleteProduct;
    // Load brands/categories for the add-product modal selects
    loadBrands();
    loadCategories();

    fetchProducts();
    // TODO: Thêm logic tìm kiếm, phân trang, modal thêm/sửa/xóa sản phẩm
});