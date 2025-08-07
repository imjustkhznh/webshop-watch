const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: './config.env' });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.static(__dirname));

// Log all requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Test DELETE route
app.delete('/test', (req, res) => {
    res.json({ message: 'DELETE test successful' });
});

// Test GET route
app.get('/test', (req, res) => {
    res.json({ message: 'GET test successful' });
});

// Create sample orders for testing
app.post('/api/create-sample-orders', async (req, res) => {
    try {
        const connection = await createConnection();
        
        // Get existing customers
        const [customers] = await connection.execute('SELECT id FROM users WHERE role = "customer" LIMIT 3');
        const [products] = await connection.execute('SELECT id FROM products LIMIT 3');
        
        if (customers.length === 0 || products.length === 0) {
            connection.release();
            return res.status(400).json({ error: 'No customers or products found' });
        }
        
        // Create sample orders
        const sampleOrders = [
            { user_id: customers[0].id, total_amount: 2500000, status: 'delivered' },
            { user_id: customers[1]?.id || customers[0].id, total_amount: 1800000, status: 'processing' },
            { user_id: customers[2]?.id || customers[0].id, total_amount: 3200000, status: 'pending' }
        ];
        
        for (let i = 0; i < sampleOrders.length; i++) {
            const order = sampleOrders[i];
            
            // Insert order
            const [orderResult] = await connection.execute(
                'INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, ?)',
                [order.user_id, order.total_amount, order.status]
            );
            
            // Insert order details
            await connection.execute(
                'INSERT INTO order_details (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                [orderResult.insertId, products[i % products.length].id, 1, order.total_amount]
            );
        }
        
        connection.release();
        res.json({ message: 'Sample orders created successfully' });
    } catch (error) {
        console.error('Error creating sample orders:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Customers API endpoints
app.get('/api/customers', async (req, res) => {
    console.log('GET /api/customers called');
    try {
        const connection = await createConnection();
        
        const query = `
            SELECT id, 
                   COALESCE(full_name, 'N/A') as name, 
                   email, 
                   COALESCE(phone, 'N/A') as phone, 
                   COALESCE(address, 'N/A') as address, 
                   created_at,
                   (SELECT COUNT(*) FROM orders WHERE user_id = users.id) as order_count
            FROM users
            WHERE role = 'customer'
            ORDER BY created_at DESC
        `;
        
        console.log('Executing query:', query);
        const [customers] = await connection.execute(query);
        console.log('Query result:', customers);
        connection.release();
        
        res.json({ customers });
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete customer API endpoint
app.delete('/api/customers/:id', async (req, res) => {
    console.log('DELETE /api/customers/:id called with id:', req.params.id);
    try {
        const connection = await createConnection();
        const customerId = req.params.id;
        
        console.log('Checking if customer exists with ID:', customerId);
        
        // Check if customer exists
        const [existingCustomer] = await connection.execute(
            'SELECT id FROM users WHERE id = ? AND role = ?',
            [customerId, 'customer']
        );
        
        console.log('Existing customer result:', existingCustomer);
        
        if (existingCustomer.length === 0) {
            connection.release();
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        // Start transaction
        await connection.beginTransaction();
        
        try {
            // 1. Delete order_details first (child of orders)
            await connection.execute('DELETE FROM order_details WHERE order_id IN (SELECT id FROM orders WHERE user_id = ?)', [customerId]);
            
            // 2. Delete orders
            await connection.execute('DELETE FROM orders WHERE user_id = ?', [customerId]);
            
            // 3. Delete cart_items (if any)
            await connection.execute('DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE user_id = ?)', [customerId]);
            
            // 4. Delete carts
            await connection.execute('DELETE FROM carts WHERE user_id = ?', [customerId]);
            
            // 5. Delete reviews
            await connection.execute('DELETE FROM reviews WHERE user_id = ?', [customerId]);
            
            // 6. Finally delete the customer
            await connection.execute('DELETE FROM users WHERE id = ? AND role = ?', [customerId, 'customer']);
            
            // Commit transaction
            await connection.commit();
            connection.release();
            
            res.json({ message: 'Customer deleted successfully' });
        } catch (error) {
            // Rollback on error
            await connection.rollback();
            connection.release();
            throw error;
        }
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Tạo connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5, // Clever Cloud free tier limit
    queueLimit: 0
});

// Thay thế hàm createConnection bằng lấy connection từ pool
const createConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Got connection from pool!');
        return connection;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        throw error;
    }
};

// Initialize database tables (if not exists)
const initDatabase = async (connection) => {
    try {
        console.log('✅ Database connection verified successfully!');
        console.log('📊 Using existing database structure from SQL script');
        
        // Add customer information columns to orders table if they don't exist
        try {
            // Check if columns exist first
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
            
            // Update existing orders to have created_at if they don't have it
            try {
                const [ordersWithoutCreatedAt] = await connection.execute(
                    'SELECT id FROM orders WHERE created_at IS NULL'
                );
                
                if (ordersWithoutCreatedAt.length > 0) {
                    await connection.execute(
                        'UPDATE orders SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL'
                    );
                    console.log(`✅ Updated ${ordersWithoutCreatedAt.length} orders with created_at timestamp`);
                }
            } catch (error) {
                console.log('ℹ️ Error updating existing orders:', error.message);
            }
            
            // Check and fix total_amount column type
            const totalAmountColumn = columns.find(col => col.COLUMN_NAME === 'total_amount');
            if (totalAmountColumn) {
                const dataType = totalAmountColumn.DATA_TYPE;
                const precision = totalAmountColumn.NUMERIC_PRECISION;
                
                console.log(`ℹ️ total_amount column: ${dataType}(${precision})`);
                
                // If it's DECIMAL with small precision, change to DECIMAL(15,2) to handle large amounts
                if (dataType === 'decimal' && precision <= 10) {
                    await connection.execute('ALTER TABLE orders MODIFY COLUMN total_amount DECIMAL(15,2)');
                    console.log('✅ Fixed total_amount column type to DECIMAL(15,2)');
                }
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

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

// API Routes
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password, full_name } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email and password are required' });
        }

        const connection = await createConnection();
        
        // Check if user already exists
        const [existingUsers] = await connection.execute(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUsers.length > 0) {
            connection.release();
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user (default role is 'customer')
        const [result] = await connection.execute(
            'INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)',
            [username, email, hashedPassword, full_name, 'customer']
        );

        connection.release();

        res.status(201).json({ 
            message: 'User registered successfully',
            user_id: result.insertId 
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const connection = await createConnection();
        
        // Find user
        const [users] = await connection.execute(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, username]
        );

        connection.release();

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                user_id: user.id, 
                username: user.username,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Protected route middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        console.log('JWT decoded user:', user);
        req.user = user;
        // Ensure user.id exists for compatibility
        if (user.user_id) {
            req.user.id = user.user_id;
        }
        console.log('Final req.user:', req.user);
        next();
    });
};

// Protected route example
app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const connection = await createConnection();
        
        const [users] = await connection.execute(
            'SELECT id, username, email, full_name, role, created_at FROM users WHERE id = ?',
            [req.user.user_id]
        );

        connection.release();

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: users[0] });

    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Search API
app.get('/api/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim() === '') {
            return res.json({ products: [] });
        }
        
        const connection = await createConnection();
        
        const searchQuery = `
            SELECT p.*, b.name as brand_name, c.name as category_name 
            FROM products p 
            LEFT JOIN brands b ON p.brand_id = b.id 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.name LIKE ? OR p.description LIKE ? OR b.name LIKE ? OR c.name LIKE ?
            ORDER BY p.id DESC
        `;
        
        const searchTerm = `%${q.trim()}%`;
        const params = [searchTerm, searchTerm, searchTerm, searchTerm];
        
        const [products] = await connection.execute(searchQuery, params);
        connection.release();
        
        res.json({ products });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Products API
app.get('/api/products', async (req, res) => {
    try {
        const { category_id, brand_id } = req.query;
        const connection = await createConnection();
        
        let query = `
            SELECT p.*, b.name as brand_name, c.name as category_name 
            FROM products p 
            LEFT JOIN brands b ON p.brand_id = b.id 
            LEFT JOIN categories c ON p.category_id = c.id 
        `;
        
        const params = [];
        
        if (category_id || brand_id) {
            query += ' WHERE ';
            const conditions = [];
            
            if (category_id) {
                conditions.push('p.category_id = ?');
                params.push(category_id);
            }
            
            if (brand_id) {
                conditions.push('p.brand_id = ?');
                params.push(brand_id);
            }
            query += conditions.join(' AND ');
        }
        
        query += ' ORDER BY p.id DESC';
        
        const [products] = await connection.execute(query, params);
        connection.release();
        res.json({ products });
    } catch (error) {
        console.error('Products error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Lấy chi tiết sản phẩm
app.get('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await createConnection();
        const [products] = await connection.execute(
            `SELECT p.*, b.name as brand_name, c.name as category_name
             FROM products p
             LEFT JOIN brands b ON p.brand_id = b.id
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.id = ?`, [id]
        );
        connection.release();
        if (products.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ product: products[0] });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Lấy ảnh sản phẩm
app.get('/api/products/:id/image', async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await createConnection();
        const [products] = await connection.execute(
            'SELECT image FROM products WHERE id = ?', [id]
        );
        connection.release();
        
        if (products.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const imagePath = products[0].image;
        if (!imagePath) {
            return res.status(404).json({ error: 'Product image not found' });
        }
        
        // Trả về ảnh từ thư mục static
        const fullPath = path.join(__dirname, imagePath);
        res.sendFile(fullPath);
    } catch (error) {
        console.error('Error getting product image:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Thêm sản phẩm
app.post('/api/products', async (req, res) => {
    try {
        const { name, brand_id, category_id, price, stock, description, image } = req.body;




        const connection = await createConnection();
        const [result] = await connection.execute(
            'INSERT INTO products (name, brand_id, category_id, price, stock, description, image) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, brand_id, category_id, price, stock, description, image]
        );
        connection.release();
        res.status(201).json({ success: true, product_id: result.insertId });
    } catch (error) {
        console.error('Add product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Sửa sản phẩm
app.put('/api/products/:id', async (req, res) => {
    try {
        const { name, brand_id, category_id, price, stock, description, image } = req.body;
        const { id } = req.params;
        const connection = await createConnection();
        await connection.execute(
            'UPDATE products SET name=?, brand_id=?, category_id=?, price=?, stock=?, description=?, image=? WHERE id=?',
            [name, brand_id, category_id, price, stock, description, image, id]
        );
        connection.release();
        res.json({ success: true });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Xóa sản phẩm
app.delete('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await createConnection();
        await connection.execute('DELETE FROM products WHERE id = ?', [id]);
        connection.release();
        res.json({ success: true });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user orders (transaction history)
app.get('/api/orders/user', authenticateToken, async (req, res) => {
    try {
        const connection = await createConnection();
        
        // Get orders with order details and product information
        const query = `
            SELECT 
                o.id,
                o.user_id,
                o.total_amount,
                o.status,
                o.created_at,
                od.id as detail_id,
                od.product_id,
                od.quantity,
                od.price as detail_price,
                p.name as product_name,
                p.image as product_image
            FROM orders o
            LEFT JOIN order_details od ON o.id = od.order_id
            LEFT JOIN products p ON od.product_id = p.id
            WHERE o.user_id = ?
            ORDER BY o.created_at DESC
        `;
        
        const [rows] = await connection.execute(query, [req.user.user_id]);
        connection.release();
        
        // Group orders with their details
        const ordersMap = new Map();
        
        rows.forEach(row => {
            if (!ordersMap.has(row.id)) {
                ordersMap.set(row.id, {
                    id: row.id,
                    user_id: row.user_id,
                    total_amount: row.total_amount,
                    status: row.status,
                    created_at: row.created_at,
                    order_details: []
                });
            }
            
            if (row.detail_id) {
                ordersMap.get(row.id).order_details.push({
                    id: row.detail_id,
                    product_id: row.product_id,
                    quantity: row.quantity,
                    price: row.detail_price,
                    product_name: row.product_name,
                    product_image: row.product_image
                });
            }
        });
        
        const orders = Array.from(ordersMap.values());
        res.json({ orders });
        
    } catch (error) {
        console.error('Get user orders error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user profile
app.put('/api/profile/update', authenticateToken, async (req, res) => {
    try {
        const { full_name, phone, address } = req.body;
        const connection = await createConnection();
        
        await connection.execute(
            'UPDATE users SET full_name = ?, phone = ?, address = ? WHERE id = ?',
            [full_name, phone, address, req.user.user_id]
        );
        
        connection.release();
        res.json({ success: true, message: 'Profile updated successfully' });
        
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Brands API
app.get('/api/brands', async (req, res) => {
    try {
        const connection = await createConnection();
        
        const [brands] = await connection.execute('SELECT * FROM brands ORDER BY name');

        connection.release();

        res.json({ brands });

    } catch (error) {
        console.error('Brands error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Categories API
app.get('/api/categories', async (req, res) => {
    try {
        const connection = await createConnection();
        
        const [categories] = await connection.execute('SELECT * FROM categories ORDER BY name');

        connection.release();

        res.json({ categories });

    } catch (error) {
        console.error('Categories error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start server
const startServer = async () => {
    try {
        const connection = await createConnection();
        await initDatabase(connection);
        connection.release();

        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📱 Frontend: ${process.env.CORS_ORIGIN || 'http://localhost:5500'}`);
            console.log(`🔗 API: http://localhost:${PORT}/api`);
        });

    } catch (error) {
        console.error('❌ Server startup failed:', error.message);
        process.exit(1);
    }
};

app.post('/api/promotions', async (req, res) => {
    try {
        const { name, discount, start_date, end_date, description } = req.body;
        const connection = await createConnection();
        await connection.execute(
            'INSERT INTO promotions (name, discount, start_date, end_date, description) VALUES (?, ?, ?, ?, ?)',
            [name, discount, start_date, end_date, description]
        );
        connection.release();
        res.status(201).json({ success: true });
    } catch (error) {
        console.error('Add promotion error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/promotions', async (req, res) => {
    try {
        const connection = await createConnection();
        const [promotions] = await connection.execute('SELECT * FROM promotions ORDER BY start_date DESC');
        connection.release();
        res.json({ promotions });
    } catch (error) {
        console.error('Get promotions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/promotions/:id', async (req, res) => {
    try {
        const { name, discount, start_date, end_date, description } = req.body;
        const { id } = req.params;
        const connection = await createConnection();
        await connection.execute(
            'UPDATE promotions SET name=?, discount=?, start_date=?, end_date=?, description=? WHERE id=?',
            [name, discount, start_date, end_date, description, id]
        );
        connection.release();
        res.json({ success: true });
    } catch (error) {
        console.error('Update promotion error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Cập nhật thông tin khách hàng
app.put('/api/customers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, address } = req.body;
        const connection = await createConnection();
        await connection.execute(
            'UPDATE users SET full_name=?, email=?, phone=?, address=? WHERE id=?',
            [name, email, phone, address, id]
        );
        connection.release();
        res.json({ success: true });
    } catch (error) {
        console.error('Update customer error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



// API nhập kho (cập nhật số lượng tồn kho)
app.post('/api/inventory/import', async (req, res) => {
    try {
        const { product_id, quantity } = req.body;
        if (!product_id || !quantity || quantity <= 0) {
            return res.status(400).json({ error: 'Thiếu thông tin hoặc số lượng không hợp lệ' });
        }
        const connection = await createConnection();
        // Tăng số lượng tồn kho
        await connection.execute(
            'UPDATE products SET stock = stock + ? WHERE id = ?',
            [quantity, product_id]
        );
        connection.release();
        res.json({ success: true });
    } catch (error) {
        console.error('Inventory import error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API báo cáo tổng hợp
app.get('/api/reports/summary', async (req, res) => {
    try {
        const connection = await createConnection();
        // Tổng doanh thu tháng
        const [revenueRows] = await connection.execute(
            'SELECT SUM(total_amount) as revenue FROM orders WHERE MONTH(order_date) = MONTH(CURRENT_DATE())'
        );
        // Số đơn hàng tháng
        const [orderRows] = await connection.execute(
            'SELECT COUNT(*) as order_count FROM orders WHERE MONTH(order_date) = MONTH(CURRENT_DATE())'
        );
        // Khách hàng mới tháng
        const [customerRows] = await connection.execute(
            'SELECT COUNT(*) as new_customers FROM users WHERE role = "customer" AND MONTH(created_at) = MONTH(CURRENT_DATE())'
        );
        // Sản phẩm bán chạy
        const [topProductRows] = await connection.execute(
            `SELECT p.name, SUM(od.quantity) as sold
             FROM order_details od
             JOIN products p ON od.product_id = p.id
             JOIN orders o ON od.order_id = o.id
             WHERE MONTH(o.order_date) = MONTH(CURRENT_DATE())
             GROUP BY od.product_id
             ORDER BY sold DESC LIMIT 1`
        );
        // Tổng sản phẩm tồn kho
        const [stockRows] = await connection.execute(
            'SELECT SUM(stock) as stock_count FROM products'
        );
        connection.release();
        res.json({
            revenue: revenueRows[0].revenue || 0,
            order_count: orderRows[0].order_count || 0,
            new_customers: customerRows[0].new_customers || 0,
            top_product: topProductRows[0]?.name || '',
            stock_count: stockRows[0].stock_count || 0
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API báo cáo doanh thu từng ngày trong tháng
app.get('/api/reports/daily-revenue', async (req, res) => {
    try {
        const connection = await createConnection();
        const [rows] = await connection.execute(
            `SELECT DATE(order_date) as date, SUM(total_amount) as revenue
             FROM orders
             WHERE MONTH(order_date) = MONTH(CURRENT_DATE())
             GROUP BY DATE(order_date)
             ORDER BY date`
        );
        connection.release();
        res.json({ daily: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API lấy chi tiết đơn hàng
app.get('/api/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await createConnection();
        // Lấy thông tin đơn hàng
        const [orders] = await connection.execute(
            `SELECT o.*, u.full_name as customer_name, u.address as shipping_address
             FROM orders o
             LEFT JOIN users u ON o.user_id = u.id
             WHERE o.id = ?`, [id]
        );
        if (orders.length === 0) {
            connection.release();
            return res.status(404).json({ error: 'Order not found' });
        }
        // Lấy danh sách sản phẩm trong đơn hàng
        const [items] = await connection.execute(
            `SELECT od.*, p.name as product_name
             FROM order_details od
             LEFT JOIN products p ON od.product_id = p.id
             WHERE od.order_id = ?`, [id]
        );
        connection.release();
        res.json({
            order: {
                ...orders[0],
                items
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API lấy danh sách đơn hàng
app.get('/api/orders', async (req, res) => {
    try {
        let limit = parseInt(req.query.limit, 10);
        if (isNaN(limit) || limit <= 0) limit = 100;
        const connection = await createConnection();
        // Lấy danh sách đơn hàng, join với users để lấy tên khách hàng
        const [orders] = await connection.execute(
            `SELECT o.*, u.full_name as customer_name
             FROM orders o
             LEFT JOIN users u ON o.user_id = u.id
             ORDER BY o.order_date DESC
             LIMIT ${limit}`
        );
        // Lấy tên sản phẩm cho từng đơn hàng
        for (let order of orders) {
            const [items] = await connection.execute(
                `SELECT p.name FROM order_details od
                 JOIN products p ON od.product_id = p.id
                 WHERE od.order_id = ?`, [order.id]
            );
            order.product_names = (items && items.length > 0) ? items.map(i => i.name).join(', ') : '';
        }
        connection.release();
        res.json({ orders });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API cập nhật trạng thái đơn hàng
app.put('/api/orders/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        // Validate status
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Must be one of: pending, processing, shipped, delivered, cancelled' });
        }
        
        const connection = await createConnection();
        
        // Check if order exists
        const [orders] = await connection.execute(
            'SELECT id FROM orders WHERE id = ?', [id]
        );
        
        if (orders.length === 0) {
            connection.release();
            return res.status(404).json({ error: 'Order not found' });
        }
        
        // Update order status
        await connection.execute(
            'UPDATE orders SET status = ? WHERE id = ?',
            [status, id]
        );
        
        connection.release();
        
        res.json({ 
            success: true, 
            message: 'Order status updated successfully',
            order_id: id,
            new_status: status
        });
        
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API thêm thương hiệu mới
app.post('/api/brands', async (req, res) => {
    try {
        const { name } = req.body;
        
        if (!name || name.trim() === '') {
            return res.status(400).json({ error: 'Tên thương hiệu không được để trống' });
        }
        
        const connection = await createConnection();
        
        // Check if brand name already exists
        const [existingBrands] = await connection.execute(
            'SELECT id FROM brands WHERE name = ?', [name.trim()]
        );
        
        if (existingBrands.length > 0) {
            connection.release();
            return res.status(400).json({ error: 'Thương hiệu này đã tồn tại' });
        }
        
        // Insert new brand
        const [result] = await connection.execute(
            'INSERT INTO brands (name) VALUES (?)',
            [name.trim()]
        );
        
        connection.release();
        
        res.json({ 
            success: true, 
            message: 'Thêm thương hiệu thành công',
            brand_id: result.insertId
        });
        
    } catch (error) {
        console.error('Error adding brand:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API cập nhật thương hiệu
app.put('/api/brands/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        
        if (!name || name.trim() === '') {
            return res.status(400).json({ error: 'Tên thương hiệu không được để trống' });
        }
        
        const connection = await createConnection();
        
        // Check if brand exists
        const [brands] = await connection.execute(
            'SELECT id FROM brands WHERE id = ?', [id]
        );
        
        if (brands.length === 0) {
            connection.release();
            return res.status(404).json({ error: 'Thương hiệu không tồn tại' });
        }
        
        // Check if new name already exists (excluding current brand)
        const [existingBrands] = await connection.execute(
            'SELECT id FROM brands WHERE name = ? AND id != ?', [name.trim(), id]
        );
        
        if (existingBrands.length > 0) {
            connection.release();
            return res.status(400).json({ error: 'Thương hiệu này đã tồn tại' });
        }
        
        // Update brand
        await connection.execute(
            'UPDATE brands SET name = ? WHERE id = ?',
            [name.trim(), id]
        );
        
        connection.release();
        
        res.json({ 
            success: true, 
            message: 'Cập nhật thương hiệu thành công'
        });
        
    } catch (error) {
        console.error('Error updating brand:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API xóa thương hiệu
app.delete('/api/brands/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const connection = await createConnection();
        
        // Check if brand exists
        const [brands] = await connection.execute(
            'SELECT id, name FROM brands WHERE id = ?', [id]
        );
        
        if (brands.length === 0) {
            connection.release();
            return res.status(404).json({ error: 'Thương hiệu không tồn tại' });
        }
        
        // Check if brand is being used by any products
        const [products] = await connection.execute(
            'SELECT id FROM products WHERE brand_id = ?', [id]
        );
        
        if (products.length > 0) {
            connection.release();
            return res.status(400).json({ error: 'Không thể xóa thương hiệu đang được sử dụng bởi sản phẩm' });
        }
        
        // Delete brand
        await connection.execute(
            'DELETE FROM brands WHERE id = ?',
            [id]
        );
        
        connection.release();
        
        res.json({ 
            success: true, 
            message: 'Xóa thương hiệu thành công'
        });
        
    } catch (error) {
        console.error('Error deleting brand:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API tạo đơn hàng
app.post('/api/orders', authenticateToken, async (req, res) => {
    try {
        const { customerInfo, paymentMethod, items, subtotal, shipping, discountCode, discountAmount, total } = req.body;
        const userId = req.user.id;
        
        // Debug: Log the received data
        console.log('Received order data:', {
            customerInfo,
            paymentMethod,
            items: items ? items.length : 0,
            subtotal,
            shipping,
            total,
            userId
        });
        
        // Validate input
        if (!customerInfo || !items || items.length === 0) {
            return res.status(400).json({ error: 'Thông tin đơn hàng không hợp lệ' });
        }
        
        const connection = await createConnection();
        
        // Kiểm tra tồn kho
        for (const item of items) {
            const [products] = await connection.execute(
                'SELECT stock FROM products WHERE id = ?',
                [item.id]
            );
            
            if (products.length === 0) {
                connection.release();
                return res.status(400).json({ error: `Sản phẩm ID ${item.id} không tồn tại` });
            }
            
            if (products[0].stock < item.quantity) {
                connection.release();
                return res.status(400).json({ error: `Sản phẩm ${item.name} chỉ còn ${products[0].stock} trong kho` });
            }
        }
        
        // Tạo đơn hàng với thông tin khách hàng
        const [orderResult] = await connection.execute(
            `INSERT INTO orders (user_id, total_amount, status, order_date, 
             customer_name, customer_phone, customer_email, customer_address, 
             customer_city, customer_district, customer_note, payment_method,
             discount_code, discount_amount) 
             VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                total,
                'pending',
                customerInfo.fullName || null,
                customerInfo.phone || null,
                customerInfo.email || null,
                customerInfo.address || null,
                customerInfo.city || null,
                customerInfo.district || null,
                customerInfo.note || null,
                paymentMethod || null,
                discountCode || null,
                discountAmount || 0
            ]
        );
        
        const orderId = orderResult.insertId;
        
        // Cập nhật số lần sử dụng của discount code nếu có
        if (discountCode) {
            await connection.execute(
                'UPDATE discount_codes SET used_count = used_count + 1 WHERE code = ?',
                [discountCode]
            );
        }
        
        // Tạo chi tiết đơn hàng và cập nhật tồn kho
        for (const item of items) {
            // Thêm chi tiết đơn hàng
            await connection.execute(
                'INSERT INTO order_details (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                [orderId, item.id, item.quantity, item.price]
            );
            
            // Cập nhật tồn kho
            await connection.execute(
                'UPDATE products SET stock = stock - ? WHERE id = ?',
                [item.quantity, item.id]
            );
        }
        
        connection.release();
        
        res.json({ 
            success: true, 
            message: 'Đặt hàng thành công',
            orderId: orderId
        });
        
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API lấy danh sách đơn hàng của user
app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const connection = await createConnection();
        
        const [orders] = await connection.execute(
            `SELECT o.*, 
                    GROUP_CONCAT(CONCAT(p.name, ' (', od.quantity, ')') SEPARATOR ', ') as items
             FROM orders o
             LEFT JOIN order_details od ON o.id = od.order_id
             LEFT JOIN products p ON od.product_id = p.id
             WHERE o.user_id = ?
             GROUP BY o.id
             ORDER BY o.order_date DESC`,
            [userId]
        );
        
        connection.release();
        
        res.json({ orders });
        
    } catch (error) {
        console.error('Error getting orders:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API lấy tất cả đơn hàng cho admin
app.get('/api/admin/orders', authenticateToken, async (req, res) => {
    try {
        // Kiểm tra quyền admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Không có quyền truy cập' });
        }
        
        const connection = await createConnection();
        
        const [orders] = await connection.execute(
            `SELECT o.*, 
                    u.username as customer_username,
                    COALESCE(o.customer_name, u.full_name) as customer_name,
                    COALESCE(o.customer_email, u.email) as customer_email,
                    o.customer_phone,
                    o.customer_address,
                    o.customer_city,
                    o.customer_district,
                    GROUP_CONCAT(CONCAT(p.name, ' (', od.quantity, ')') SEPARATOR ', ') as items
             FROM orders o
             LEFT JOIN users u ON o.user_id = u.id
             LEFT JOIN order_details od ON o.id = od.order_id
             LEFT JOIN products p ON od.product_id = p.id
             GROUP BY o.id
             ORDER BY o.order_date DESC`
        );
        
        connection.release();
        
        res.json({ orders });
        
    } catch (error) {
        console.error('Error getting admin orders:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API endpoints for discount codes
// Get all discount codes (admin only)
app.get('/api/admin/discount-codes', authenticateToken, async (req, res) => {
    try {
        // Kiểm tra quyền admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Không có quyền truy cập' });
        }
        
        const connection = await createConnection();
        
        const [discountCodes] = await connection.execute(
            'SELECT * FROM discount_codes ORDER BY created_at DESC'
        );
        
        connection.release();
        
        res.json({ discountCodes });
        
    } catch (error) {
        console.error('Error getting discount codes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new discount code (admin only)
app.post('/api/admin/discount-codes', authenticateToken, async (req, res) => {
    try {
        // Kiểm tra quyền admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Không có quyền truy cập' });
        }
        
        const { code, description, discount_type, discount_value, min_order_amount, max_uses, valid_until } = req.body;
        
        if (!code || !discount_type || !discount_value) {
            return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
        }
        
        const connection = await createConnection();
        
        const [result] = await connection.execute(
            `INSERT INTO discount_codes (code, description, discount_type, discount_value, min_order_amount, max_uses, valid_until) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [code, description, discount_type, discount_value, min_order_amount || 0, max_uses, valid_until]
        );
        
        connection.release();
        
        res.json({ 
            success: true, 
            message: 'Tạo mã giảm giá thành công',
            discountCodeId: result.insertId
        });
        
    } catch (error) {
        console.error('Error creating discount code:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Mã giảm giá đã tồn tại' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Update discount code (admin only)
app.put('/api/admin/discount-codes/:id', authenticateToken, async (req, res) => {
    try {
        // Kiểm tra quyền admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Không có quyền truy cập' });
        }
        
        const { id } = req.params;
        const { code, description, discount_type, discount_value, min_order_amount, max_uses, is_active, valid_until } = req.body;
        
        const connection = await createConnection();
        
        await connection.execute(
            `UPDATE discount_codes 
             SET code = ?, description = ?, discount_type = ?, discount_value = ?, 
                 min_order_amount = ?, max_uses = ?, is_active = ?, valid_until = ?
             WHERE id = ?`,
            [code, description, discount_type, discount_value, min_order_amount || 0, max_uses, is_active, valid_until, id]
        );
        
        connection.release();
        
        res.json({ 
            success: true, 
            message: 'Cập nhật mã giảm giá thành công'
        });
        
    } catch (error) {
        console.error('Error updating discount code:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Mã giảm giá đã tồn tại' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Delete discount code (admin only)
app.delete('/api/admin/discount-codes/:id', authenticateToken, async (req, res) => {
    try {
        // Kiểm tra quyền admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Không có quyền truy cập' });
        }
        
        const { id } = req.params;
        
        const connection = await createConnection();
        
        await connection.execute('DELETE FROM discount_codes WHERE id = ?', [id]);
        
        connection.release();
        
        res.json({ 
            success: true, 
            message: 'Xóa mã giảm giá thành công'
        });
        
    } catch (error) {
        console.error('Error deleting discount code:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Validate discount code (public endpoint)
app.post('/api/validate-discount-code', async (req, res) => {
    try {
        const { code, orderAmount } = req.body;
        
        if (!code || !orderAmount) {
            return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
        }
        
        const connection = await createConnection();
        
        const [discountCodes] = await connection.execute(
            'SELECT * FROM discount_codes WHERE code = ? AND is_active = TRUE',
            [code]
        );
        
        if (discountCodes.length === 0) {
            connection.release();
            return res.json({ 
                valid: false, 
                message: 'Mã giảm giá không hợp lệ' 
            });
        }
        
        const discountCode = discountCodes[0];
        
        // Kiểm tra thời hạn
        if (discountCode.valid_until && new Date() > new Date(discountCode.valid_until)) {
            connection.release();
            return res.json({ 
                valid: false, 
                message: 'Mã giảm giá đã hết hạn' 
            });
        }
        
        // Kiểm tra số lần sử dụng
        if (discountCode.max_uses && discountCode.used_count >= discountCode.max_uses) {
            connection.release();
            return res.json({ 
                valid: false, 
                message: 'Mã giảm giá đã hết lượt sử dụng' 
            });
        }
        
        // Kiểm tra giá trị đơn hàng tối thiểu
        if (orderAmount < discountCode.min_order_amount) {
            connection.release();
            return res.json({ 
                valid: false, 
                message: `Đơn hàng tối thiểu ${discountCode.min_order_amount.toLocaleString('vi-VN')}đ để sử dụng mã này` 
            });
        }
        
        // Tính toán giá trị giảm
        let discountAmount = 0;
        if (discountCode.discount_type === 'percentage') {
            discountAmount = (orderAmount * discountCode.discount_value) / 100;
        } else {
            discountAmount = discountCode.discount_value;
        }
        
        connection.release();
        
        res.json({ 
            valid: true, 
            message: 'Mã giảm giá hợp lệ',
            discountCode: {
                id: discountCode.id,
                code: discountCode.code,
                description: discountCode.description,
                discount_type: discountCode.discount_type,
                discount_value: discountCode.discount_value,
                discount_amount: discountAmount
            }
        });
        
    } catch (error) {
        console.error('Error validating discount code:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

startServer(); 