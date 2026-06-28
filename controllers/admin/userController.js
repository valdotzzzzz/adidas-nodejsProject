const { User } = require('../../models');

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'name', 'email', 'role', 'status', 'createdAt'],
            order: [['createdAt', 'DESC']]
        });
        return res.status(200).json(users);
    } catch (error) {
        return res.status(500).json({ message: 'Server error fetching users.', error: error.message });
    }
};

exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!['customer', 'staff', 'admin'].includes(role)) {
            return res.status(422).json({ message: 'Invalid role value.' });
        }

        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        if (user.id === req.user.id && role !== 'admin') {
            return res.status(400).json({ message: 'You cannot change your own role away from admin.' });
        }

        user.role = role;
        await user.save();

        return res.status(200).json({ message: 'User role updated successfully.', user });
    } catch (error) {
        return res.status(500).json({ message: 'Server error updating user role.', error: error.message });
    }
};

exports.toggleUserStatus = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        if (user.id === req.user.id) {
            return res.status(400).json({ message: 'You cannot deactivate your own account.' });
        }

        user.status = user.status === 'active' ? 'deactivated' : 'active';
        await user.save();

        return res.status(200).json({ message: `User ${user.status === 'active' ? 'reactivated' : 'deactivated'} successfully.`, user });
    } catch (error) {
        return res.status(500).json({ message: 'Server error updating user status.', error: error.message });
    }
};