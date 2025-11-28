const ChatService = require('../services/chatService');

exports.getConversations = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const conversations = await ChatService.getConversations();
        res.json({ conversations });
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const conversationId = Number(req.params.id);
        if (!conversationId) {
            return res.status(400).json({ error: 'Invalid conversation ID' });
        }

        const conversation = await ChatService.getConversationById(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        if (req.user.role !== 'admin' && conversation.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const limit = Math.min(Number(req.query.limit) || 100, 200);
        const messages = await ChatService.getMessages(conversationId, limit);
        await ChatService.markMessagesRead(conversationId, req.user.role === 'admin' ? 'admin' : 'user');

        res.json({ conversation, messages });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updateConversationStatus = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const conversationId = Number(req.params.id);
        const { status } = req.body;
        const allowed = ['open', 'pending', 'resolved'];
        if (!conversationId || !allowed.includes(status)) {
            return res.status(400).json({ error: 'Invalid payload' });
        }

        await ChatService.updateStatus(conversationId, status);
        const updated = await ChatService.getConversationById(conversationId);
        res.json({ conversation: updated });
    } catch (error) {
        console.error('Update conversation status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.uploadAttachment = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Không có file được tải lên' });
        }

        const isImage = req.file.mimetype.startsWith('image/');
        const attachment = {
            url: `/uploads/chat/${req.file.filename}`,
            name: req.file.originalname || req.file.filename,
            mimeType: req.file.mimetype,
            size: req.file.size,
            type: isImage ? 'image' : 'file'
        };

        res.json({ attachment });
    } catch (error) {
        console.error('Upload chat attachment error:', error);
        res.status(500).json({ error: 'Không thể tải file, vui lòng thử lại' });
    }
};

