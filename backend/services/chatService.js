const { getConnection } = require('../config/database');

class ChatService {
    static async findOrCreateConversation(userId) {
        const connection = await getConnection();
        try {
            await connection.beginTransaction();

            const [existing] = await connection.execute(
                'SELECT * FROM chat_conversations WHERE user_id = ? LIMIT 1',
                [userId]
            );

            if (existing.length) {
                await connection.commit();
                return existing[0];
            }

            const [users] = await connection.execute(
                'SELECT id, username, full_name, email, phone FROM users WHERE id = ?',
                [userId]
            );
            const user = users[0] || {};

            const [result] = await connection.execute(
                `INSERT INTO chat_conversations (
                    user_id,
                    user_name,
                    user_email,
                    user_phone
                ) VALUES (?, ?, ?, ?)`,
                [
                    userId,
                    user.full_name || user.username || 'Khách hàng',
                    user.email || null,
                    user.phone || null
                ]
            );

            const conversationId = result.insertId;
            const [created] = await connection.execute(
                'SELECT * FROM chat_conversations WHERE id = ?',
                [conversationId]
            );

            await connection.commit();
            return created[0];
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async getConversations() {
        const connection = await getConnection();
        try {
            const [rows] = await connection.execute(`
                SELECT c.*, 
                       COALESCE(c.last_message_at, c.created_at) AS sort_time
                FROM chat_conversations c
                ORDER BY sort_time DESC
            `);
            return rows;
        } finally {
            connection.release();
        }
    }

    static async getConversationById(conversationId) {
        const connection = await getConnection();
        try {
            const [rows] = await connection.execute(
                'SELECT * FROM chat_conversations WHERE id = ?',
                [conversationId]
            );
            return rows[0] || null;
        } finally {
            connection.release();
        }
    }

    static async getConversationByUser(userId) {
        const connection = await getConnection();
        try {
            const [rows] = await connection.execute(
                'SELECT * FROM chat_conversations WHERE user_id = ?',
                [userId]
            );
            return rows[0] || null;
        } finally {
            connection.release();
        }
    }

    static async getMessages(conversationId, limit = 50) {
        const connection = await getConnection();
        try {
            const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 500));
            const [rows] = await connection.execute(
                `
                SELECT id, conversation_id, sender_type, sender_id, content, created_at
                FROM chat_messages
                WHERE conversation_id = ?
                ORDER BY created_at ASC
                LIMIT ${safeLimit}
            `,
                [conversationId]
            );
            return rows;
        } finally {
            connection.release();
        }
    }

    static async createMessage({ conversationId, senderType, senderId, content }) {
        const connection = await getConnection();
        try {
            await connection.beginTransaction();

            const [result] = await connection.execute(
                `INSERT INTO chat_messages (conversation_id, sender_type, sender_id, content)
                 VALUES (?, ?, ?, ?)`,
                [conversationId, senderType, senderId || null, content]
            );

            await connection.execute(
                `UPDATE chat_conversations
                 SET last_message = ?, 
                     last_sender = ?, 
                     last_message_at = NOW(),
                     unread_admin = unread_admin + IF(? = 'user', 1, 0),
                     unread_user = unread_user + IF(? = 'admin', 1, 0),
                     status = IF(status = 'resolved', 'open', status)
                 WHERE id = ?`,
                [content, senderType, senderType, senderType, conversationId]
            );

            const [messageRow] = await connection.execute(
                'SELECT * FROM chat_messages WHERE id = ?',
                [result.insertId]
            );

            await connection.commit();
            return messageRow[0];
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async markMessagesRead(conversationId, target = 'admin') {
        const connection = await getConnection();
        try {
            if (target === 'admin') {
                await connection.execute(
                    'UPDATE chat_conversations SET unread_admin = 0 WHERE id = ?',
                    [conversationId]
                );
            } else {
                await connection.execute(
                    'UPDATE chat_conversations SET unread_user = 0 WHERE id = ?',
                    [conversationId]
                );
            }
        } finally {
            connection.release();
        }
    }

    static async updateStatus(conversationId, status) {
        const connection = await getConnection();
        try {
            await connection.execute(
                'UPDATE chat_conversations SET status = ?, updated_at = NOW() WHERE id = ?',
                [status, conversationId]
            );
        } finally {
            connection.release();
        }
    }
}

module.exports = ChatService;

