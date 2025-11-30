const Brand = require('../models/Brand');

class BrandService {
    /**
     * Get all brands
     * @returns {Promise<Array>} - List of brands
     */
    static async getAllBrands() {
        return await Brand.getAllBrands();
    }

    /**
     * Get brand by ID
     * @param {number} brandId - Brand ID
     * @returns {Promise<Object>} - Brand data
     * @throws {Error} - If brand not found
     */
    static async getBrandById(brandId) {
        const [brand] = await Brand.getBrandById(brandId);
        if (!brand) {
            throw new Error('Brand not found');
        }
        return brand;
    }

    /**
     * Create new brand (Admin only)
     * @param {Object} brandData - Brand data
     * @returns {Promise<Object>} - Created brand
     * @throws {Error} - If brand already exists
     */
    static async createBrand(brandData) {
        const { name } = brandData;

        if (!name) {
            throw new Error('Name is required');
        }

        // Check if brand already exists
        const allBrands = await Brand.getAllBrands();
        const existingBrand = allBrands.find(b => b.name === name);
        if (existingBrand) {
            throw new Error('Brand with this name already exists');
        }

        const brandId = await Brand.createBrand({ name });

        // Get the created brand
        const [createdBrand] = await Brand.getBrandById(brandId);
        return createdBrand;
    }

    /**
     * Update brand (Admin only)
     * @param {number} brandId - Brand ID
     * @param {Object} brandData - Updated brand data
     * @returns {Promise<boolean>} - Success status
     * @throws {Error} - If brand not found or name already exists
     */
    static async updateBrand(brandId, brandData) {
        const { name } = brandData;

        if (!name) {
            throw new Error('Name is required');
        }

        // Check for duplicate name
        const allBrands = await Brand.getAllBrands();
        if (allBrands.some(b => b.name === name && b.id != brandId)) {
            throw new Error('Brand with this name already exists');
        }

        const updated = await Brand.updateBrandById(brandId, { name });
        if (!updated) {
            throw new Error('Brand not found');
        }

        return true;
    }

    /**
     * Delete brand (Admin only)
     * @param {number} brandId - Brand ID
     * @returns {Promise<boolean>} - Success status
     * @throws {Error} - If brand not found
     */
    static async deleteBrand(brandId) {
        const [brand] = await Brand.getBrandById(brandId);

        if (!brand) {
            throw new Error('Brand not found');
        }

        // TODO: Check if there are any products associated with this brand
        // If yes, either prevent deletion or handle cascade delete

        // Delete brand using raw query
        const { getConnection } = require('../config/database');
        const connection = await getConnection();
        try {
            await connection.execute('DELETE FROM brands WHERE id = ?', [brandId]);
            return true;
        } finally {
            connection.release();
        }
    }
}

module.exports = BrandService;
