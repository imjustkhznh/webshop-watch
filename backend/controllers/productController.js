const ProductService = require('../services/productService');

// Lấy tất cả sản phẩm
exports.getAllProducts = async (req, res) => {
    try {
        const products = await ProductService.getAllProducts(req.query);
        res.json({ products });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Lấy sản phẩm theo ID
exports.getProductById = async (req, res) => {
    try {
        const product = await ProductService.getProductById(req.params.id);
        res.json({ product });
    } catch (error) {
        console.error('Get product error:', error);
        const statusCode = error.message === 'Product not found' ? 404 : 500;
        res.status(statusCode).json({ error: error.message || 'Internal server error' });
    }
};

// Tạo sản phẩm mới (Admin only)
exports.createProduct = async (req, res) => {
    try {
        const productId = await ProductService.createProduct(req.body);
        res.status(201).json({
            message: 'Product created successfully',
            productId
        });
    } catch (error) {
        console.error('Create product error:', error);
        const statusCode = error.message.includes('required') ? 400 : 500;
        res.status(statusCode).json({ error: error.message || 'Internal server error' });
    }
};

// Cập nhật sản phẩm (Admin only)
exports.updateProduct = async (req, res) => {
    try {
        await ProductService.updateProduct(req.params.id, req.body);
        res.json({ message: 'Product updated successfully' });
    } catch (error) {
        console.error('Update product error:', error);
        const statusCode = error.message === 'Product not found' ? 404 : 500;
        res.status(statusCode).json({ error: error.message || 'Internal server error' });
    }
};

// Xóa sản phẩm (Admin only)
exports.deleteProduct = async (req, res) => {
    try {
        await ProductService.deleteProduct(req.params.id);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Delete product error:', error);
        const statusCode = error.message === 'Product not found' ? 404 : 500;
        res.status(statusCode).json({ error: error.message || 'Internal server error' });
    }
};

