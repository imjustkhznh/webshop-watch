const Brand = require('../models/Brand');

// @desc    Get all brands
// @route   GET /api/brands
// @access  Public
exports.getBrands = async (req, res, next) => {
    try {
        const brands = await Brand.getAllBrands();
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
        const id = req.params.id;
        const [brand] = await Brand.getBrandById(id);
        if (!brand) {
            return res.status(404).json({
                success: false,
                error: 'Brand not found'
            });
        }
        res.status(200).json({
            success: true,
            data: brand
        });
    } catch (err) {
        // Thêm hàm getBrandById vào model Brand.js
        next(err);
    }
};

// @desc    Create new brand
// @route   POST /api/brands
// @access  Private/Admin
exports.createBrand = async (req, res, next) => {
    try {
        const { name, description, logo } = req.body;
        
        // Check if brand already exists
        const existingBrand = await Brand.findOne({ where: { name } });
        if (existingBrand) {
            return res.status(400).json({
                success: false,
                error: 'Brand with this name already exists'
            });
        }
        
        const brand = await Brand.create({
            name,
            description,
            logo
        });
        
        res.status(201).json({
            success: true,
            data: brand
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update brand
// @route   PUT /api/brands/:id
// @access  Private/Admin
exports.updateBrand = async (req, res, next) => {
    try {
        const { name, description, logo, is_active } = req.body;
        
        let brand = await Brand.findByPk(req.params.id);
        
        if (!brand) {
            return res.status(404).json({
                success: false,
                error: 'Brand not found'
            });
        }
        
        // Check if name is being updated and if it's already taken
        if (name && name !== brand.name) {
            const existingBrand = await Brand.findOne({ where: { name } });
            if (existingBrand) {
                return res.status(400).json({
                    success: false,
                    error: 'Brand with this name already exists'
                });
            }
        }
        
        // Update brand
        brand = await brand.update({
            name: name || brand.name,
            description: description !== undefined ? description : brand.description,
            logo: logo !== undefined ? logo : brand.logo,
            is_active: is_active !== undefined ? is_active : brand.is_active
        });
        
        res.status(200).json({
            success: true,
            data: brand
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete brand
// @route   DELETE /api/brands/:id
// @access  Private/Admin
exports.deleteBrand = async (req, res, next) => {
    try {
        const brand = await Brand.findByPk(req.params.id);
        
        if (!brand) {
            return res.status(404).json({
                success: false,
                error: 'Brand not found'
            });
        }
        
        // TODO: Check if there are any products associated with this brand
        // If yes, either prevent deletion or handle cascade delete
        
        await brand.destroy();
        
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        next(err);
    }
};
