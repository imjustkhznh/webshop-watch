let currentProduct = null;
let currentQuantity = 1;
let productImages = [];

function getProductIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

function generateProductImages(product) {
    // Tạo nhiều ảnh từ ảnh chính (giả lập)
    const baseImage = product.image;
    const images = [baseImage];
    
    // Thêm các ảnh khác nhau dựa trên thương hiệu
    if (product.brand_name) {
        const brand = product.brand_name.toLowerCase();
        if (brand.includes('casio')) {
            images.push('static/casio1.webp');
        } else if (brand.includes('citizen')) {
            images.push('static/citizen-sale_1741339694.jpg.webp');
        } else if (brand.includes('orient')) {
            images.push('static/Orient-RA-AS0106L30B-2.webp');
        }
    }
    
    return images;
}

function generateSpecifications(product) {
    const specs = [
        { label: 'Thương hiệu', value: product.brand_name || 'N/A' },
        { label: 'Loại sản phẩm', value: product.category_name || 'N/A' },
        { label: 'Tên sản phẩm', value: product.name },
        { label: 'Giá gốc', value: formatPrice(product.original_price || product.price) },
        { label: 'Giá bán', value: formatPrice(product.price) },
        { label: 'Tồn kho', value: `${product.stock} sản phẩm` },
        { label: 'Trạng thái', value: product.stock > 0 ? 'Còn hàng' : 'Hết hàng' }
    ];

    if (product.discount && product.discount > 0) {
        specs.push({ label: 'Giảm giá', value: `${product.discount}%` });
    }

    return specs;
}

function updateQuantity(action) {
    if (action === 'increase' && currentQuantity < currentProduct.stock) {
        currentQuantity++;
    } else if (action === 'decrease' && currentQuantity > 1) {
        currentQuantity--;
    }
    
    document.getElementById('quantity-input').value = currentQuantity;
}

function changeMainImage(imageSrc) {
    document.getElementById('main-image').src = imageSrc;
    
    // Update active thumbnail
    document.querySelectorAll('.thumbnail').forEach(thumb => {
        thumb.classList.remove('active');
        if (thumb.src === imageSrc) {
            thumb.classList.add('active');
        }
    });
}

function openImageZoom() {
    const overlay = document.getElementById('image-zoom-overlay');
    const zoomedImage = document.getElementById('zoomed-image');
    const mainImage = document.getElementById('main-image');
    
    zoomedImage.src = mainImage.src;
    overlay.style.display = 'flex';
}

function closeImageZoom() {
    document.getElementById('image-zoom-overlay').style.display = 'none';
}

function toggleWishlist(productId, productName, price, image) {
    let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const existingIndex = wishlist.findIndex(item => item.id === productId);
    
    if (existingIndex !== -1) {
        wishlist.splice(existingIndex, 1);
        showNotification('Đã xóa khỏi danh sách yêu thích!', 'info');
    } else {
        wishlist.push({ id: productId, name: productName, price: price, image: image });
        showNotification('Đã thêm vào danh sách yêu thích!', 'success');
    }
    
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    
    // Update wishlist button
    const wishlistBtn = document.querySelector('.wishlist-btn');
    const isInWishlist = wishlist.some(item => item.id === productId);
    wishlistBtn.classList.toggle('active', isInWishlist);
}

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

async function loadRelatedProducts(productId, brandId, categoryId) {
    try {
        const response = await fetch(`/api/products?brand_id=${brandId}&category_id=${categoryId}`);
        const data = await response.json();
        
        // Filter out current product and limit to 4
        const relatedProducts = data.products
            .filter(p => p.id != productId)
            .slice(0, 4);
        
        const container = document.getElementById('related-products');
        
        if (relatedProducts.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #6c757d;">Không có sản phẩm liên quan</p>';
            return;
        }
        
        container.innerHTML = relatedProducts.map(product => 
            '<div class="product-card" onclick="window.location.href=\'product.html?id=' + product.id + '\'">' +
                '<img src="' + product.image + '" alt="' + product.name + '">' +
                '<div class="product-card-info">' +
                    '<div class="product-card-title">' + product.name + '</div>' +
                    '<div class="product-card-price">' + formatPrice(product.price) + '</div>' +
                '</div>' +
            '</div>'
        ).join('');
    } catch (error) {
        console.error('Error loading related products:', error);
    }
}

async function addToCart(productId) {
    try {
        if (!currentProduct) {
            showNotification('Không thể lấy thông tin sản phẩm!', 'error');
            return;
        }
        
        const stockQuantity = Number(currentProduct.stock) || 0;
        
        // Kiểm tra tồn kho
        if (stockQuantity <= 0) {
            showNotification('Sản phẩm đã hết hàng!', 'warning');
            return;
        }
        
        const discount = Number(currentProduct.discount) || 0;
        const originalPrice = Number(currentProduct.original_price) || Number(currentProduct.price);
        let salePrice = Number(currentProduct.price);
        
        if (discount > 0) {
            salePrice = Math.round(originalPrice * (1 - discount / 100));
        }
        
        // Sử dụng logic giỏ hàng từ index.js
        let cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const idx = cart.findIndex(item => item.id === productId);
        
        // Kiểm tra xem có vượt quá tồn kho không
        if (currentQuantity > stockQuantity) {
            showNotification(`🚨 CHỈ CÒN ${stockQuantity} SẢN PHẨM! 🚨\n⚡ Nhanh tay đặt hàng trước khi hết!`, 'warning');
            return;
        }
        
        if (idx !== -1) {
            cart[idx].quantity += currentQuantity;
        } else {
            cart.push({ 
                id: productId, 
                name: currentProduct.name, 
                price: salePrice, 
                quantity: currentQuantity 
            });
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Cập nhật số lượng hiển thị trên giỏ hàng
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        document.querySelectorAll('.cart-count').forEach(el => el.textContent = count);
        
        showNotification(`Đã thêm ${currentQuantity} sản phẩm vào giỏ hàng!`, 'success');
    } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification('Có lỗi xảy ra khi thêm vào giỏ hàng!', 'error');
    }
}

async function loadProductDetail() {
    const id = getProductIdFromUrl();
    if (!id) {
        document.getElementById('product-detail').innerHTML = '<div style="text-align: center; padding: 50px;">Không tìm thấy sản phẩm!</div>';
        return;
    }

    try {
        const response = await fetch(`/api/products/${id}`);
        const data = await response.json();
        
        if (!data.product) {
            document.getElementById('product-detail').innerHTML = '<div style="text-align: center; padding: 50px;">Không tìm thấy sản phẩm!</div>';
            return;
        }

        currentProduct = data.product;
        productImages = generateProductImages(currentProduct);
        
        const discount = Number(currentProduct.discount) || 0;
        const originalPrice = Number(currentProduct.original_price) || Number(currentProduct.price);
        let salePrice = Number(currentProduct.price);
        
        if (discount > 0) {
            salePrice = Math.round(originalPrice * (1 - discount / 100));
        }

        // Check if product is in wishlist
        const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        const isInWishlist = wishlist.some(item => item.id === currentProduct.id);

        // Generate gallery thumbnails
        const thumbnailsContainer = document.getElementById('gallery-thumbnails');
        thumbnailsContainer.innerHTML = productImages.map((image, index) => {
            const activeClass = index === 0 ? 'active' : '';
            return `<img class="thumbnail ${activeClass}" src="${image}" alt="Product thumbnail ${index + 1}" onclick="changeMainImage('${image}')">`;
        }).join('');

        // Set main image
        document.getElementById('main-image').src = productImages[0];
        document.getElementById('main-image').alt = currentProduct.name;

        // Generate product info
        const productInfoContainer = document.getElementById('product-info');
        const originalPriceHtml = discount > 0 ? `<span class="original-price">${formatPrice(originalPrice)}</span>` : '';
        const discountHtml = discount > 0 ? `<span class="discount-percentage">-${discount}%</span>` : '';
        const wishlistClass = isInWishlist ? 'active' : '';
        const productNameEscaped = currentProduct.name.replace(/'/g, "\\'");
        
        productInfoContainer.innerHTML = 
            '<h1 class="product-title">' + currentProduct.name + '</h1>' +
            '<div class="product-brand">' + (currentProduct.brand_name || 'Thương hiệu') + '</div>' +
            '<div class="price-section">' +
                originalPriceHtml +
                '<span class="current-price">' + formatPrice(salePrice) + '</span>' +
                discountHtml +
            '</div>' +
            '<div class="stock-info">' +
                '<i class="fas fa-check-circle stock-icon"></i>' +
                '<span class="stock-text">Còn ' + currentProduct.stock + ' sản phẩm</span>' +
            '</div>' +
            '<div class="quantity-section">' +
                '<div class="quantity-label">Số lượng:</div>' +
                '<div class="quantity-controls">' +
                    '<button class="quantity-btn" onclick="updateQuantity(\'decrease\')">-</button>' +
                    '<input type="number" class="quantity-input" id="quantity-input" value="1" min="1" max="' + currentProduct.stock + '" onchange="currentQuantity = parseInt(this.value)">' +
                    '<button class="quantity-btn" onclick="updateQuantity(\'increase\')">+</button>' +
                '</div>' +
            '</div>' +
            '<div class="action-buttons">' +
                '<button class="btn-primary" onclick="addToCart(' + currentProduct.id + ')">' +
                    '<i class="fas fa-shopping-cart"></i>' +
                    'Thêm vào giỏ hàng' +
                '</button>' +
                '<button class="btn-secondary" onclick="window.location.href=\'checkout.html\'">' +
                    '<i class="fas fa-credit-card"></i>' +
                    'Mua ngay' +
                '</button>' +
                '<button class="wishlist-btn ' + wishlistClass + '" onclick="toggleWishlist(' + currentProduct.id + ', \'' + productNameEscaped + '\', ' + salePrice + ', \'' + currentProduct.image + '\')">' +
                    '<i class="fas fa-heart"></i>' +
                '</button>' +
            '</div>';

        // Generate description
        const description = currentProduct.description || 'Sản phẩm chất lượng cao với thiết kế sang trọng và hiện đại.';
        document.getElementById('product-description').innerHTML = 
            '<p style="font-size: 1.1rem; line-height: 1.6; color: #2c3e50;">' + description + '</p>';

        // Generate specifications
        const specifications = generateSpecifications(currentProduct);
        document.getElementById('product-specifications').innerHTML = specifications.map(spec => 
            '<div class="spec-item">' +
                '<span class="spec-label">' + spec.label + '</span>' +
                '<span class="spec-value">' + spec.value + '</span>' +
            '</div>'
        ).join('');

        // Load related products
        await loadRelatedProducts(currentProduct.id, currentProduct.brand_id, currentProduct.category_id);

    } catch (error) {
        console.error('Error loading product:', error);
        document.getElementById('product-detail').innerHTML = '<div style="text-align: center; padding: 50px;">Có lỗi xảy ra khi tải sản phẩm!</div>';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    loadProductDetail();
    
    // Cập nhật số lượng giỏ hàng khi trang load
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => el.textContent = count);

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Image zoom
    document.getElementById('main-image').addEventListener('click', openImageZoom);
    
    // Close zoom on overlay click
    document.getElementById('image-zoom-overlay').addEventListener('click', function(e) {
        if (e.target === this) {
            closeImageZoom();
        }
    });

    // Quantity input change
    document.addEventListener('change', function(e) {
        if (e.target.id === 'quantity-input') {
            const value = parseInt(e.target.value);
            if (value >= 1 && value <= currentProduct.stock) {
                currentQuantity = value;
            } else {
                e.target.value = currentQuantity;
            }
        }
    });
});
