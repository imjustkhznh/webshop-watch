const AuthService = require('../services/authService');

// Đăng ký
exports.register = async (req, res) => {
    try {
        const result = await AuthService.register(req.body);
        res.status(201).json({
            message: 'Registration successful',
            ...result
        });
    } catch (error) {
        console.error('Registration error:', error);
        const statusCode = error.message === 'User already exists' ? 400 : 500;
        res.status(statusCode).json({ error: error.message || 'Internal server error' });
    }
};

// Đăng nhập
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await AuthService.login(username, password);
        res.json({
            message: 'Login successful',
            ...result
        });
    } catch (error) {
        console.error('Login error:', error);
        const statusCode = error.message === 'Invalid credentials' ? 401 : 500;
        res.status(statusCode).json({ error: error.message || 'Internal server error' });
    }
};

// Verify token
exports.verifyToken = (req, res) => {
    res.json({
        message: 'Token is valid',
        user: req.user
    });
};

