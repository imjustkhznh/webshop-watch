const CategoryService = require('../services/categoryService');

exports.getCategories = async (req, res) => {
    try {
        const categories = await CategoryService.getCategories();
        res.json({ success: true, categories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.json({ success: true, categories: CategoryService.FALLBACK_CATEGORIES });
    }
};
