// Lọc và hiển thị sản phẩm loại "dây đồng hồ"
async function loadDayDongHoProducts() {
    try {
        const res = await fetch('/api/products');
        const data = await res.json();
        // Lọc sản phẩm có category_name hoặc category là "dây đồng hồ" (không phân biệt hoa thường)
        const filtered = data.products.filter(p => {
            if (p.category_name) {
                return p.category_name.trim().toLowerCase().includes('dây đồng hồ');
            }
            if (p.category) {
                return p.category.trim().toLowerCase().includes('dây đồng hồ');
            }
            return false;
        });
        renderDayDongHoProducts(filtered);
    } catch (err) {
        console.error('Lỗi khi tải sản phẩm dây đồng hồ:', err);
    }
}

function renderDayDongHoProducts(products) {
    const grid = document.querySelector('.products-grid');
    if (!grid) return;
    grid.innerHTML = '';
    if (products.length === 0) {
        grid.innerHTML = '<p>Không có sản phẩm dây đồng hồ nào.</p>';
        return;
    }
    products.forEach(product => {
        let discount = Number(product.discount) || 0;
        let originalPrice = Number(product.original_price) || Number(product.price);
        let salePrice = Number(product.price);
        if (discount > 0) {
            salePrice = Math.round(originalPrice * (1 - discount / 100));
        }
        
        // Check if product is in wishlist
        const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        const isInWishlist = wishlist.some(item => item.id === product.id);
        
        grid.innerHTML += `
        <div class="product-card" data-id="${product.id}">
            ${discount > 0 ? `<div class="discount-badge">-${discount}%</div>` : ''}
            <div class="product-image">
                <img src="${product.image || 'static/no-image.png'}" alt="${product.name}">
                <button class="wishlist-btn ${isInWishlist ? 'active' : ''}" onclick="toggleWishlist(${product.id}, '${product.name.replace(/'/g, "\\'")}', ${salePrice}, '${product.image || 'static/no-image.png'}')">
                    <i class="fas fa-heart"></i>
                </button>
            </div>
            <h4>${product.name}</h4>
            <div class="price-group">
                ${discount > 0 ? `<span class="old-price">${originalPrice.toLocaleString('vi-VN')}đ</span>` : ''}
                <span class="sale-price">${salePrice.toLocaleString('vi-VN')}đ</span>
            </div>
            <button class="add-to-cart" data-id="${product.id}"> <i class='fas fa-cart-plus'></i> Thêm vào giỏ</button>
            <a href="product.html?id=${product.id}" class="btn-detail" style="display:block;margin-top:8px;">Xem chi tiết</a>
        </div>
        `;
    });
}

document.addEventListener('DOMContentLoaded', loadDayDongHoProducts);

// Lắng nghe nút "Xem chi tiết" để chuyển trang

document.addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-detail')) {
        const id = e.target.getAttribute('data-id');
        if (id) {
            window.location.href = `product.html?id=${id}`;
        }
    }
});
