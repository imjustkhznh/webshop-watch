const UserService = require('../services/userService');
const fs = require('fs');
const path = require('path');

// Lấy thông tin user
exports.getProfile = async (req, res) => {
    try {
        const user = await UserService.getProfile(req.user.id);
        res.json({ user });
    } catch (error) {
        console.error('Get profile error:', error);
        const statusCode = error.message === 'User not found' ? 404 : 500;
        res.status(statusCode).json({ error: error.message || 'Internal server error' });
    }
};

// Cập nhật thông tin user
exports.updateProfile = async (req, res) => {
    try {
        await UserService.updateProfile(req.user.id, req.body);
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update profile error:', error);
        const statusCode = error.message === 'User not found' ? 404 : 500;
        res.status(statusCode).json({ error: error.message || 'Internal server error' });
    }
};

// Upload avatar
exports.uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const avatarPath = await UserService.uploadAvatar(req.user.id, req.file);
        res.json({ 
            message: 'Avatar uploaded successfully',
            avatar: avatarPath
        });
    } catch (error) {
        console.error('Upload avatar error:', error);
        // Delete uploaded file if database update fails
        if (req.file) {
            const filePath = path.join(__dirname, '../../public/images/avatars', req.file.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        const statusCode = error.message === 'User not found' ? 404 : 500;
        res.status(statusCode).json({ error: error.message || 'Internal server error' });
    }
};

// Đổi mật khẩu
exports.changePassword = async (req, res) => {
    try {
        const { current_password, new_password } = req.body;
        await UserService.changePassword(req.user.id, current_password, new_password);
        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        const statusCode = error.message === 'Current password is incorrect' ? 401 : 
                          error.message === 'User not found' ? 404 : 500;
        res.status(statusCode).json({ error: error.message || 'Internal server error' });
    }
};

// Lấy tất cả customers (Admin only)
exports.getAllCustomers = async (req, res) => {
    try {
        const customers = await UserService.getAllCustomers();
        res.json({ customers });
    } catch (error) {
        console.error('Get customers error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Xóa customer (Admin only)
exports.deleteCustomer = async (req, res) => {
    try {
        await UserService.deleteCustomer(req.params.id);
        res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        console.error('Delete customer error:', error);
        const statusCode = error.message === 'Customer not found' ? 404 : 500;
        res.status(statusCode).json({ error: error.message || 'Internal server error' });
    }
};

