const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: './config/config.env' });

const { getConnection } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

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

// Test routes
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
        app.listen(PORT, () => {
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
