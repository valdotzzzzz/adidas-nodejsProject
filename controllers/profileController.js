const { User, Address } = require('../models');
const bcrypt = require('bcryptjs');

// GET /api/profile — current user's info + saved addresses
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: ['id', 'name', 'email', 'role', 'createdAt'],
            include: [{ model: Address }]
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({ message: 'Server error fetching profile.', error: error.message });
    }
};

// PATCH /api/profile — update name / email
exports.updateProfile = async (req, res) => {
    try {
        const { name, email } = req.body;
        const user = await User.findByPk(req.user.id);

        if (!name || !email) {
            return res.status(400).json({ message: 'Name and email are required.' });
        }

        // If the email is changing, make sure nobody else already has it
        if (email !== user.email) {
            const existing = await User.findOne({ where: { email } });
            if (existing) {
                return res.status(400).json({ message: 'That email address is already in use.' });
            }
        }

        await user.update({ name, email });

        return res.status(200).json({
            message: 'Profile updated successfully.',
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        return res.status(500).json({ message: 'Server error updating profile.', error: error.message });
    }
};

// PUT /api/profile/password — change password
exports.updatePassword = async (req, res) => {
    try {
        const { current_password, password, password_confirmation } = req.body;

        if (!current_password || !password || !password_confirmation) {
            return res.status(400).json({ message: 'Current password, new password, and confirmation are all required.' });
        }

        if (password !== password_confirmation) {
            return res.status(400).json({ message: 'New password and confirmation do not match.' });
        }

        if (password.length < 8) {
            return res.status(400).json({ message: 'New password must be at least 8 characters long.' });
        }

        const user = await User.findByPk(req.user.id);
        const isMatch = await bcrypt.compare(current_password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Your current password is incorrect.' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        return res.status(200).json({ message: 'Password updated successfully.' });
    } catch (error) {
        return res.status(500).json({ message: 'Server error updating password.', error: error.message });
    }
};

// DELETE /api/profile — permanently delete the account
exports.deleteAccount = async (req, res) => {
    try {
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({ message: 'Please enter your password to confirm account deletion.' });
        }

        const user = await User.findByPk(req.user.id);
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect password.' });
        }

        await user.destroy();
        return res.status(200).json({ message: 'Account deleted successfully.' });
    } catch (error) {
        return res.status(500).json({ message: 'Server error deleting account.', error: error.message });
    }
};