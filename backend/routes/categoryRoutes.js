const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// Lấy tất cả categories
router.get('/', categoryController.getCategories);

module.exports = router;
