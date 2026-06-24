const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, addressController.getAddresses);
router.post('/', protect, addressController.createAddress);
router.patch('/:id', protect, addressController.updateAddress);
router.delete('/:id', protect, addressController.deleteAddress);
router.patch('/:id/default', protect, addressController.setDefaultAddress);

module.exports = router;