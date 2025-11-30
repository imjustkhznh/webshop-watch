const BrandService = require('../services/brandService');

// @desc    Get all brands
// @route   GET /api/brands
// @access  Public
exports.getBrands = async (req, res, next) => {
    try {
        const brands = await BrandService.getAllBrands();
        res.status(200).json({
            success: true,
            brands
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single brand
// @route   GET /api/brands/:id
// @access  Public
exports.getBrand = async (req, res, next) => {
    try {
        const brand = await BrandService.getBrandById(req.params.id);
        res.status(200).json({
            success: true,
            data: brand
        });
    } catch (err) {
        const statusCode = err.message === 'Brand not found' ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            error: err.message || 'Internal server error'
        });
    }
};

// @desc    Create new brand
// @route   POST /api/brands
// @access  Private/Admin
exports.createBrand = async (req, res, next) => {
    try {
        const brand = await BrandService.createBrand(req.body);
        res.status(201).json({
            success: true,
            data: brand
        });
    } catch (err) {
        const statusCode = err.message.includes('already exists') ? 400 : 500;
        res.status(statusCode).json({
            success: false,
            error: err.message || 'Internal server error'
        });
    }
};

// @desc    Update brand (chỉ cập nhật name)
// @route   PUT /api/brands/:id
// @access  Private/Admin
exports.updateBrand = async (req, res, next) => {
    try {
        await BrandService.updateBrand(req.params.id, req.body);
        res.status(200).json({ success: true });
    } catch (err) {
        const statusCode = err.message === 'Brand not found' ? 404 : 
                         err.message.includes('already exists') || err.message.includes('required') ? 400 : 500;
        res.status(statusCode).json({ 
            success: false, 
            error: err.message || 'Internal server error' 
        });
    }
};

// @desc    Delete brand
// @route   DELETE /api/brands/:id
// @access  Private/Admin
exports.deleteBrand = async (req, res, next) => {
    try {
        await BrandService.deleteBrand(req.params.id);
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        const statusCode = err.message === 'Brand not found' ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            error: err.message || 'Internal server error'
        });
    }
};
