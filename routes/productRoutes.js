const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Public catalog routes
router.get('/', productController.getAllProducts);

// Admin/Staff Protected CRUD endpoints (Fulfills Quiz 6)
router.post('/', protect, authorize('admin', 'staff'), productController.createProduct);
router.put('/:id', protect, authorize('admin', 'staff'), productController.updateProduct);
router.delete('/:id', protect, authorize('admin', 'staff'), productController.deleteProduct);

module.exports = router;