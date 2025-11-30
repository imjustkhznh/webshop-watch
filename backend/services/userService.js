const bcrypt = require('bcryptjs');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

class UserService {
    /**
     * Get user profile by ID
     * @param {number} userId - User ID
     * @returns {Promise<Object>} - User profile (without password)
     * @throws {Error} - If user not found
     */
    static async getProfile(userId) {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Remove password from response
        delete user.password;
        return user;
    }

    /**
     * Update user profile
     * @param {number} userId - User ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<boolean>} - Success status
     * @throws {Error} - If user not found
     */
    static async updateProfile(userId, updateData) {
        const { full_name, phone, address, date_of_birth, gender } = updateData;

        const data = {};
        if (full_name !== undefined) data.full_name = full_name;
        if (phone !== undefined) data.phone = phone || null;
        if (address !== undefined) data.address = address || null;
        if (date_of_birth !== undefined) data.date_of_birth = date_of_birth || null;
        if (gender !== undefined) data.gender = gender || null;

        const updated = await User.update(userId, data);
        if (!updated) {
            throw new Error('User not found');
        }

        return true;
    }

    /**
     * Upload and update user avatar
     * @param {number} userId - User ID
     * @param {Object} file - Uploaded file object
     * @returns {Promise<string>} - Avatar path
     * @throws {Error} - If file not provided or user not found
     */
    static async uploadAvatar(userId, file) {
        if (!file) {
            throw new Error('No file uploaded');
        }

        // Get user and delete old avatar if exists
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        if (user.avatar) {
            const oldAvatarPath = path.join(__dirname, '../../public', user.avatar);
            if (fs.existsSync(oldAvatarPath)) {
                fs.unlinkSync(oldAvatarPath);
            }
        }

        // Save new avatar path to database
        const avatarPath = `/images/avatars/${file.filename}`;
        await User.update(userId, { avatar: avatarPath });

        return avatarPath;
    }

    /**
     * Change user password
     * @param {number} userId - User ID
     * @param {string} currentPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Promise<boolean>} - Success status
     * @throws {Error} - If password is incorrect or user not found
     */
    static async changePassword(userId, currentPassword, newPassword) {
        if (!currentPassword || !newPassword) {
            throw new Error('Current and new password are required');
        }

        // Get current user
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            throw new Error('Current password is incorrect');
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await User.update(userId, { password: hashedPassword });

        return true;
    }

    /**
     * Get all customers (Admin only)
     * @returns {Promise<Array>} - List of customers
     */
    static async getAllCustomers() {
        return await User.getAllCustomers();
    }

    /**
     * Delete customer (Admin only)
     * @param {number} customerId - Customer ID
     * @returns {Promise<boolean>} - Success status
     * @throws {Error} - If customer not found or not a customer
     */
    static async deleteCustomer(customerId) {
        // Check if customer exists
        const customer = await User.findById(customerId);
        if (!customer || customer.role !== 'customer') {
            throw new Error('Customer not found');
        }

        await User.delete(customerId);
        return true;
    }
}

module.exports = UserService;
