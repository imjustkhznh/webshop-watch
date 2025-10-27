const bcrypt = require('bcryptjs');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

// Lấy thông tin user
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Không trả về password
        delete user.password;
        res.json({ user });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Cập nhật thông tin user
exports.updateProfile = async (req, res) => {
    try {
        const { full_name, phone, address, date_of_birth, gender } = req.body;
        
        const updateData = {};
        if (full_name !== undefined) updateData.full_name = full_name;
        if (phone !== undefined) updateData.phone = phone || null;
        if (address !== undefined) updateData.address = address || null;
        if (date_of_birth !== undefined) updateData.date_of_birth = date_of_birth || null;
        if (gender !== undefined) updateData.gender = gender || null;
        
        const updated = await User.update(req.user.id, updateData);

        if (!updated) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Upload avatar
exports.uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Get user and delete old avatar if exists
        const user = await User.findById(req.user.id);
        if (user && user.avatar) {
            const oldAvatarPath = path.join(__dirname, '../../public', user.avatar);
            if (fs.existsSync(oldAvatarPath)) {
                fs.unlinkSync(oldAvatarPath);
            }
        }

        // Save new avatar path to database
        const avatarPath = `/images/avatars/${req.file.filename}`;
        await User.update(req.user.id, { avatar: avatarPath });

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
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Đổi mật khẩu
exports.changePassword = async (req, res) => {
    try {
        const { current_password, new_password } = req.body;

        if (!current_password || !new_password) {
            return res.status(400).json({ error: 'Current and new password are required' });
        }

        // Lấy user hiện tại
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Kiểm tra mật khẩu hiện tại
        const isValidPassword = await bcrypt.compare(current_password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash mật khẩu mới
        const hashedPassword = await bcrypt.hash(new_password, 10);

        // Cập nhật mật khẩu
        await User.update(req.user.id, { password: hashedPassword });

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Lấy tất cả customers (Admin only)
exports.getAllCustomers = async (req, res) => {
    try {
        const customers = await User.getAllCustomers();
        res.json({ customers });
    } catch (error) {
        console.error('Get customers error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Xóa customer (Admin only)
exports.deleteCustomer = async (req, res) => {
    try {
        const customerId = req.params.id;
        
        // Kiểm tra customer tồn tại
        const customer = await User.findById(customerId);
        if (!customer || customer.role !== 'customer') {
            return res.status(404).json({ error: 'Customer not found' });
        }

        await User.delete(customerId);
        res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        console.error('Delete customer error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

