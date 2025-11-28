const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './config/config.env' });

const { getConnection } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const ChatService = require('./services/chatService');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const brandRoutes = require('./routes/brandRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reportRoutes = require('./routes/reportRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();
const PORT = process.env.PORT || 3001;
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: true,
        credentials: true
    }
});

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());

// Serve static files from public folder
app.use(express.static(path.join(__dirname, '../public')));

// Log all requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/chat', chatRoutes);

// Test routes
io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) {
        return next(new Error('AUTH_REQUIRED'));
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        next();
    } catch (error) {
        next(new Error('INVALID_TOKEN'));
    }
});

const handleSocketError = (socket, error) => {
    console.error('Socket error:', error);
    socket.emit('chat:error', { message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.' });
};

const wrapSocketHandler = (socket, handler) => async (...args) => {
    try {
        await handler(...args);
    } catch (error) {
        handleSocketError(socket, error);
    }
};

io.on('connection', (socket) => {
    const { user } = socket;
    if (!user) return;

    const initConnection = async () => {
        if (user.role === 'admin') {
            socket.join('admins');
            const conversations = await ChatService.getConversations();
            socket.emit('chat:conversations', conversations);
        } else {
            const conversation = await ChatService.findOrCreateConversation(user.id);
            if (conversation) {
                socket.join(`conversation:${conversation.id}`);
                socket.emit('chat:conversation', conversation);
                const history = await ChatService.getMessages(conversation.id, 200);
                socket.emit('chat:history', { conversationId: conversation.id, messages: history });
                io.to('admins').emit('chat:conversation-updated', conversation);
            }
        }
    };

    initConnection().catch((error) => handleSocketError(socket, error));

    socket.on(
        'chat:join-conversation',
        wrapSocketHandler(socket, async (conversationId) => {
            if (!conversationId || user.role !== 'admin') return;
            const conversation = await ChatService.getConversationById(conversationId);
            if (!conversation) return;
            socket.join(`conversation:${conversationId}`);
            const history = await ChatService.getMessages(conversationId, 200);
            socket.emit('chat:history', { conversationId, messages: history });
            await ChatService.markMessagesRead(conversationId, 'admin');
        })
    );

    socket.on(
        'chat:mark-read',
        wrapSocketHandler(socket, async (conversationId) => {
            let targetConversationId = conversationId;
            if (!targetConversationId && user.role !== 'admin') {
                const conv = await ChatService.getConversationByUser(user.id);
                targetConversationId = conv?.id;
            }
            if (!targetConversationId) return;
            await ChatService.markMessagesRead(targetConversationId, user.role === 'admin' ? 'admin' : 'user');
        })
    );

    socket.on(
        'chat:message',
        wrapSocketHandler(socket, async (payload) => {
            if (!payload || typeof payload.message !== 'string') return;
            const trimmed = payload.message.trim();
            if (!trimmed) return;

            let { conversationId } = payload;
            if (!conversationId && user.role !== 'admin') {
                const conversation = await ChatService.findOrCreateConversation(user.id);
                conversationId = conversation.id;
            }

            if (!conversationId) return;

            const savedMessage = await ChatService.createMessage({
                conversationId,
                senderType: user.role === 'admin' ? 'admin' : 'user',
                senderId: user.id,
                content: trimmed
            });

            io.to(`conversation:${conversationId}`).emit('chat:message', savedMessage);
            const updatedConversation = await ChatService.getConversationById(conversationId);
            io.to('admins').emit('chat:conversation-updated', updatedConversation);
        })
    );
});

app.get('/test', (req, res) => {
    res.json({ message: 'GET test successful' });
});

app.delete('/test', (req, res) => {
    res.json({ message: 'DELETE test successful' });
});

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/register.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler middleware
app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
    try {
        // Test database connection
        const connection = await getConnection();
        console.log('✅ Database connected successfully!');

        // Initialize database tables if needed
        await initDatabase(connection);
        connection.release();

        // Start server
        server.listen(PORT, () => {
            console.log(`🚀 Server is running on http://localhost:${PORT}`);
            console.log(`📁 Serving frontend from: ${path.join(__dirname, '../public')}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Initialize database tables
const initDatabase = async (connection) => {
    try {
        console.log('✅ Database connection verified successfully!');
        console.log('📊 Using existing database structure from SQL script');

        // Add customer information columns to orders table if they don't exist
        try {
            const [columns] = await connection.execute(`
                SELECT COLUMN_NAME, DATA_TYPE, NUMERIC_PRECISION, NUMERIC_SCALE
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'orders' 
                AND TABLE_SCHEMA = DATABASE()
            `);

            const existingColumns = columns.map(col => col.COLUMN_NAME);
            const columnsToAdd = [];

            if (!existingColumns.includes('customer_name')) {
                columnsToAdd.push('ADD COLUMN customer_name VARCHAR(255)');
            }
            if (!existingColumns.includes('customer_phone')) {
                columnsToAdd.push('ADD COLUMN customer_phone VARCHAR(20)');
            }
            if (!existingColumns.includes('customer_email')) {
                columnsToAdd.push('ADD COLUMN customer_email VARCHAR(255)');
            }
            if (!existingColumns.includes('customer_address')) {
                columnsToAdd.push('ADD COLUMN customer_address TEXT');
            }
            if (!existingColumns.includes('customer_city')) {
                columnsToAdd.push('ADD COLUMN customer_city VARCHAR(100)');
            }
            if (!existingColumns.includes('customer_district')) {
                columnsToAdd.push('ADD COLUMN customer_district VARCHAR(100)');
            }
            if (!existingColumns.includes('customer_note')) {
                columnsToAdd.push('ADD COLUMN customer_note TEXT');
            }
            if (!existingColumns.includes('payment_method')) {
                columnsToAdd.push('ADD COLUMN payment_method VARCHAR(50)');
            }
            if (!existingColumns.includes('created_at')) {
                columnsToAdd.push('ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
            }
            if (!existingColumns.includes('discount_code')) {
                columnsToAdd.push('ADD COLUMN discount_code VARCHAR(50)');
            }
            if (!existingColumns.includes('discount_amount')) {
                columnsToAdd.push('ADD COLUMN discount_amount DECIMAL(15,2) DEFAULT 0');
            }

            if (columnsToAdd.length > 0) {
                await connection.execute(`ALTER TABLE orders ${columnsToAdd.join(', ')}`);
                console.log('✅ Customer information columns added to orders table');
            } else {
                console.log('ℹ️ Customer columns already exist');
            }

            // Create discount_codes table if it doesn't exist
            try {
                await connection.execute(`
                    CREATE TABLE IF NOT EXISTS discount_codes (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        code VARCHAR(50) UNIQUE NOT NULL,
                        description VARCHAR(255),
                        discount_type ENUM('percentage', 'fixed') NOT NULL,
                        discount_value DECIMAL(10,2) NOT NULL,
                        min_order_amount DECIMAL(15,2) DEFAULT 0,
                        max_uses INT DEFAULT NULL,
                        used_count INT DEFAULT 0,
                        is_active BOOLEAN DEFAULT TRUE,
                        valid_from DATETIME DEFAULT CURRENT_TIMESTAMP,
                        valid_until DATETIME DEFAULT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    )
                `);
                console.log('✅ Discount codes table created/verified');
            } catch (error) {
                console.log('ℹ️ Error creating discount codes table:', error.message);
            }

            // Ensure orders.status enum supports 'returned'
            try {
                await connection.execute(`
                    ALTER TABLE orders
                    MODIFY status ENUM(
                        'pending',
                        'processing',
                        'shipping',
                        'shipped',
                        'delivered',
                        'cancelled',
                        'returned'
                    ) DEFAULT 'pending'
                `);
                console.log('✅ Orders status enum updated (includes returned)');
            } catch (error) {
                console.log('ℹ️ Error updating orders status enum:', error.message);
            }

            // Create order_returns table for return/hoàn hàng requests
            try {
                await connection.execute(`
                    CREATE TABLE IF NOT EXISTS order_returns (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        order_id INT NOT NULL,
                        user_id INT NOT NULL,
                        reason VARCHAR(255),
                        description TEXT,
                        evidence TEXT,
                        status ENUM('pending','approved','rejected') DEFAULT 'pending',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        INDEX idx_order_id (order_id),
                        INDEX idx_user_id (user_id)
                    )
                `);
                console.log('✅ order_returns table created/verified');
            } catch (error) {
                console.log('ℹ️ Error creating order_returns table:', error.message);
            }

            // Create chat tables for realtime messaging
            try {
                await connection.execute(`
                    CREATE TABLE IF NOT EXISTS chat_conversations (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id INT NOT NULL,
                        user_name VARCHAR(255),
                        user_email VARCHAR(255),
                        user_phone VARCHAR(50),
                        status ENUM('open','pending','resolved') DEFAULT 'open',
                        last_message TEXT,
                        last_sender ENUM('user','admin'),
                        last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        unread_user INT DEFAULT 0,
                        unread_admin INT DEFAULT 0,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        UNIQUE KEY uniq_user_conversation (user_id),
                        INDEX idx_last_message_at (last_message_at)
                    )
                `);

                await connection.execute(`
                    CREATE TABLE IF NOT EXISTS chat_messages (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        conversation_id INT NOT NULL,
                        sender_type ENUM('user','admin','system') NOT NULL,
                        sender_id INT NULL,
                        content TEXT NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        INDEX idx_conversation (conversation_id),
                        CONSTRAINT fk_chat_messages_conversation
                            FOREIGN KEY (conversation_id)
                            REFERENCES chat_conversations(id)
                            ON DELETE CASCADE
                    )
                `);

                console.log('✅ Chat tables created/verified');
            } catch (error) {
                console.log('ℹ️ Error creating chat tables:', error.message);
            }

            // Đồng bộ trạng thái đơn đã được hoàn về 'returned'
            try {
                const [result] = await connection.execute(`
                    UPDATE orders o
                    JOIN order_returns r ON o.id = r.order_id AND r.status = 'approved'
                    SET o.status = 'returned'
                    WHERE o.status <> 'returned'
                `);
                if (result.affectedRows > 0) {
                    console.log(`✅ Synced ${result.affectedRows} returned orders`);
                } else {
                    console.log('ℹ️ No returned orders needed syncing');
                }
            } catch (error) {
                console.log('ℹ️ Error syncing returned orders:', error.message);
            }
        } catch (error) {
            console.log('ℹ️ Error checking/adding customer columns:', error.message);
        }

    } catch (error) {
        console.error('❌ Database verification failed:', error.message);
        throw error;
    }
};

// Start the server
startServer();

module.exports = app;
