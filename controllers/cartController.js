const db = require('../models');
const { CartItem, Variant, Product, Category, ProductImage } = db;

// GET /api/cart — get the logged-in user's cart with full product details
exports.getCart = async (req, res) => {
    try {
        const cartItems = await CartItem.findAll({
            where: { user_id: req.user.id },
            include: [
                {
                    model: Variant,
                    include: [
                        { model: Product, include: [Category, ProductImage] }
                    ]
                }
            ]
        });

        return res.status(200).json(cartItems);
    } catch (error) {
        return res.status(500).json({ message: 'Server error fetching cart.', error: error.message });
    }
};

// POST /api/cart — add an item to cart (or increment quantity if it already exists)
exports.addToCart = async (req, res) => {
    try {
        const { variant_id, quantity } = req.body;
        const qtyToAdd = quantity || 1;

        // Verify the variant exists and has stock
        const variant = await Variant.findByPk(variant_id);
        if (!variant) {
            return res.status(404).json({ message: 'Selected size/variant not found.' });
        }

        if (variant.stock_level <= 0) {
            return res.status(400).json({ message: 'This size is currently out of stock.' });
        }

        // Check if this variant is already in the user's cart
        let cartItem = await CartItem.findOne({
            where: { user_id: req.user.id, variant_id: variant_id }
        });

        if (cartItem) {
            cartItem.quantity += qtyToAdd;
            await cartItem.save();
        } else {
            cartItem = await CartItem.create({
                user_id: req.user.id,
                variant_id: variant_id,
                quantity: qtyToAdd
            });
        }

        return res.status(201).json({ message: 'Item added to cart successfully.', cartItem });
    } catch (error) {
        return res.status(500).json({ message: 'Server error adding item to cart.', error: error.message });
    }
};

// PUT /api/cart/:id — update quantity of a specific cart item
exports.updateCartItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;

        const cartItem = await CartItem.findOne({
            where: { id, user_id: req.user.id }
        });

        if (!cartItem) {
            return res.status(404).json({ message: 'Cart item not found.' });
        }

        if (quantity < 1) {
            return res.status(400).json({ message: 'Quantity must be at least 1.' });
        }

        cartItem.quantity = quantity;
        await cartItem.save();

        return res.status(200).json({ message: 'Cart item updated successfully.', cartItem });
    } catch (error) {
        return res.status(500).json({ message: 'Server error updating cart item.', error: error.message });
    }
};

// DELETE /api/cart/:id — remove a specific item from cart
exports.removeCartItem = async (req, res) => {
    try {
        const { id } = req.params;

        const cartItem = await CartItem.findOne({
            where: { id, user_id: req.user.id }
        });

        if (!cartItem) {
            return res.status(404).json({ message: 'Cart item not found.' });
        }

        await cartItem.destroy();

        return res.status(200).json({ message: 'Item removed from cart successfully.' });
    } catch (error) {
        return res.status(500).json({ message: 'Server error removing cart item.', error: error.message });
    }
};

// DELETE /api/cart — clear the entire cart (used after checkout)
exports.clearCart = async (req, res) => {
    try {
        await CartItem.destroy({ where: { user_id: req.user.id } });
        return res.status(200).json({ message: 'Cart cleared successfully.' });
    } catch (error) {
        return res.status(500).json({ message: 'Server error clearing cart.', error: error.message });
    }
};