const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthService {
    /**
     * Register a new user
     * @param {Object} userData - User registration data
     * @returns {Promise<Object>} - User data and token
     * @throws {Error} - If user already exists or validation fails
     */
    static async register(userData) {
        const { username, email, password, full_name } = userData;

        if (!username || !email || !password) {
            throw new Error('Username, email and password are required');
        }

        // Check if user already exists
        const existingUser = await User.findByEmailOrUsername(email);
        if (existingUser) {
            throw new Error('User already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const userId = await User.create({
            username,
            email,
            password: hashedPassword,
            full_name,
            role: 'customer'
        });

        // Generate JWT token
        const token = this.generateToken({
            id: userId,
            email,
            role: 'customer'
        });

        return {
            token,
            user: {
                id: userId,
                username,
                email,
                full_name,
                role: 'customer'
            }
        };
    }

    /**
     * Login user
     * @param {string} username - Username or email
     * @param {string} password - Password
     * @returns {Promise<Object>} - User data and token
     * @throws {Error} - If credentials are invalid
     */
    static async login(username, password) {
        if (!username || !password) {
            throw new Error('Username and password are required');
        }

        // Find user
        const user = await User.findByEmailOrUsername(username);
        if (!user) {
            throw new Error('Invalid credentials');
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            throw new Error('Invalid credentials');
        }

        // Generate JWT token
        const token = this.generateToken({
            id: user.id,
            email: user.email,
            role: user.role
        });

        return {
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role
            }
        };
    }

    /**
     * Generate JWT token
     * @param {Object} payload - Token payload
     * @returns {string} - JWT token
     */
    static generateToken(payload) {
        return jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
    }

    /**
     * Verify JWT token
     * @param {string} token - JWT token
     * @returns {Object} - Decoded token payload
     * @throws {Error} - If token is invalid
     */
    static verifyToken(token) {
        return jwt.verify(token, process.env.JWT_SECRET);
    }
}

module.exports = AuthService;
