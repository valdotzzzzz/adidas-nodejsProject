const db = require('../models');
const { Review, OrderItem, Order, Product, User } = db;

// GET /api/reviews/product/:productId — public, list reviews for a product
exports.getProductReviews = async (req, res) => {
    try {
        const reviews = await Review.findAll({
            where: { product_id: req.params.productId },
            include: [{ model: User, attributes: ['id', 'name'] }],
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json(reviews);
    } catch (error) {
        return res.status(500).json({ message: 'Server error fetching reviews.', error: error.message });
    }
};

// GET /api/reviews/can-review/:productId — check if logged-in user purchased this product
exports.canReview = async (req, res) => {
    try {
        const purchased = await hasUserPurchasedProduct(req.user.id, req.params.productId);
        const alreadyReviewed = await Review.findOne({
            where: { product_id: req.params.productId, user_id: req.user.id }
        });

        return res.status(200).json({
            can_review: purchased && !alreadyReviewed,
            has_purchased: purchased,
            already_reviewed: !!alreadyReviewed
        });
    } catch (error) {
        return res.status(500).json({ message: 'Server error checking review eligibility.', error: error.message });
    }
};

// POST /api/reviews/product/:productId — submit a review (purchase required)
exports.createReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const productId = req.params.productId;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(422).json({ message: 'Rating must be between 1 and 5.' });
        }

        const purchased = await hasUserPurchasedProduct(req.user.id, productId);
        if (!purchased) {
            return res.status(403).json({ message: 'You can only review products you have purchased.' });
        }

        const existing = await Review.findOne({
            where: { product_id: productId, user_id: req.user.id }
        });
        if (existing) {
            return res.status(409).json({ message: 'You have already reviewed this product.' });
        }

        const review = await Review.create({
            product_id: productId,
            user_id: req.user.id,
            rating,
            comment
        });

        return res.status(201).json({ message: 'Review submitted successfully.', review });
    } catch (error) {
        return res.status(500).json({ message: 'Server error submitting review.', error: error.message });
    }
};

// DELETE /api/reviews/:id — delete own review
exports.deleteReview = async (req, res) => {
    try {
        const review = await Review.findOne({
            where: { id: req.params.id, user_id: req.user.id }
        });

        if (!review) {
            return res.status(404).json({ message: 'Review not found.' });
        }

        await review.destroy();
        return res.status(200).json({ message: 'Review deleted successfully.' });
    } catch (error) {
        return res.status(500).json({ message: 'Server error deleting review.', error: error.message });
    }
};

// Helper — checks Order/OrderItem history for this product, only counting completed orders
async function hasUserPurchasedProduct(userId, productId) {
    const count = await OrderItem.count({
        where: { product_id: productId },
        include: [{
            model: Order,
            where: { user_id: userId, status: 'completed' }
        }]
    });
    return count > 0;
}