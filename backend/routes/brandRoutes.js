const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin } = require('../middleware/auth');
const {
  getBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand
} = require('../controllers/brandController');

// Public routes
router.get('/', getBrands);
router.get('/:id', getBrand);

// Protected routes (require authentication and admin role)
router.use(authenticateToken);
router.use(isAdmin);

router.post('/', createBrand);
router.put('/:id', updateBrand);
router.delete('/:id', deleteBrand);

module.exports = router;
