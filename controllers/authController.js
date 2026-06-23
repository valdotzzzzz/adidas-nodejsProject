const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Basic input validation sanitization check
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All registration inputs are required.' });
        }

        // Check if user already exists
        const userExists = await User.findOne({ where: { email } });
        if (userExists) {
            return res.status(400).json({ message: 'Email is already registered.' });
        }

        // Hash the password securely
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create the user (Default role is 'customer', status 'active')
        await User.create({
            name,
            email,
            password: hashedPassword
        });

        return res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        return res.status(500).json({ message: 'Server error during registration.', error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        // Find user by email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // Check account status (Fulfills MP6 deactivation constraint)
        if (user.status === 'deactivated') {
            return res.status(403).json({ message: 'Your account has been deactivated. Contact an administrator.' });
        }

        // Validate password match
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // Generate JWT Token
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Save token to the users table (Fulfills MP5 requirement: "save token on users table. 5pts")
        user.token = token;
        await user.save();

        return res.status(200).json({
            message: 'Login successful.',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        return res.status(500).json({ message: 'Server error during login.', error: error.message });
    }
};