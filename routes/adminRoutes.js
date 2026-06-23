const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');

// Only authenticated users with the role 'admin' can access this endpoint (Quiz 6)
router.get('/dashboard', protect, authorize('admin'), (req, res) => {
    res.status(200).json({
        message: `Welcome to the Admin Dashboard, ${req.user.name}. Secure data accessed successfully.`
    });
});

module.exports = router;