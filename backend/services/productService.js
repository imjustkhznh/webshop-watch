const Product = require('../models/Product');

class ProductService {
    /**
     * Get all products with filters
     * @param {Object} filters - Filter options (brand_id, category_id, search, limit, offset)
     * @returns {Promise<Array>} - List of products
     */
    static async getAllProducts(filters = {}) {
        const { brand_id, category_id, search, limit, offset } = filters;

        const products = await Product.getAll({
            brand_id,
            category_id,
            search,
            limit,
            offset
        });

        // Ensure frontend compatibility: expose `image` field (alias for `image_url`)
        return products.map(p => ({ ...p, image: p.image_url || p.image }));
    }

    /**
     * Get product by ID
     * @param {number} productId - Product ID
     * @returns {Promise<Object>} - Product data
     * @throws {Error} - If product not found
     */
    static async getProductById(productId) {
        const product = await Product.findById(productId);

        if (!product) {
            throw new Error('Product not found');
        }

        // Add `image` alias for frontend
        return { ...product, image: product.image_url || product.image };
    }

    /**
     * Create new product (Admin only)
     * @param {Object} productData - Product data
     * @returns {Promise<number>} - Created product ID
     * @throws {Error} - If validation fails
     */
    static async createProduct(productData) {
        const { name, description, price, brand_id, category_id, image_url, stock } = productData;

        if (!name || !price || !brand_id) {
            throw new Error('Name, price, and brand_id are required');
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

        return productId;
    }

    /**
     * Update product (Admin only)
     * @param {number} productId - Product ID
     * @param {Object} productData - Updated product data
     * @returns {Promise<boolean>} - Success status
     * @throws {Error} - If product not found
     */
    static async updateProduct(productId, productData) {
        const { name, description, price, brand_id, category_id, image_url, stock } = productData;

        const updated = await Product.update(productId, {
            name,
            description,
            price,
            brand_id,
            category_id,
            image_url,
            stock
        });

        if (!updated) {
            throw new Error('Product not found');
        }

        return true;
    }

    /**
     * Delete product (Admin only)
     * @param {number} productId - Product ID
     * @returns {Promise<boolean>} - Success status
     * @throws {Error} - If product not found
     */
    static async deleteProduct(productId) {
        const deleted = await Product.delete(productId);

        if (!deleted) {
            throw new Error('Product not found');
        }

        return true;
    }
}

module.exports = ProductService;
