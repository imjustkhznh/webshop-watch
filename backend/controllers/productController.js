const Product = require('../models/Product');

// Lấy tất cả sản phẩm
exports.getAllProducts = async (req, res) => {
    try {
        const { brand_id, category_id, search, limit, offset } = req.query;
        
        const products = await Product.getAll({
            brand_id,
            category_id,
            search,
            limit,
            offset
        });

        // Ensure frontend compatibility: expose `image` field (alias for `image_url`)
        const mapped = products.map(p => ({ ...p, image: p.image_url || p.image }));
        res.json({ products: mapped });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Lấy sản phẩm theo ID
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Add `image` alias for frontend
        const mappedProduct = { ...product, image: product.image_url || product.image };
        res.json({ product: mappedProduct });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Tạo sản phẩm mới (Admin only)
exports.createProduct = async (req, res) => {
    try {
        const { name, description, price, brand_id, category_id, image_url, stock } = req.body;

        if (!name || !price || !brand_id) {
            return res.status(400).json({ error: 'Name, price, and brand_id are required' });
        }

        const productId = await Product.create({
            name,
            description,
            price,
            brand_id,
            category_id,
            image_url,
            stock
        });

        res.status(201).json({
            message: 'Product created successfully',
            productId
        });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Cập nhật sản phẩm (Admin only)
exports.updateProduct = async (req, res) => {
    try {
        const { name, description, price, brand_id, category_id, image_url, stock } = req.body;
        
        const updated = await Product.update(req.params.id, {
            name,
            description,
            price,
            brand_id,
            category_id,
            image_url,
            stock
        });

        if (!updated) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ message: 'Product updated successfully' });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Xóa sản phẩm (Admin only)
exports.deleteProduct = async (req, res) => {
    try {
        const deleted = await Product.delete(req.params.id);

        if (!deleted) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

