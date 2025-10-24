require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3000;
const jwtSecret = process.env.JWT_SECRET;

// Middleware para parsear JSON
app.use(express.json());

// Middleware para loguear TODAS las peticiones
app.use((req, res, next) => {
    console.log('='.repeat(50));
    console.log(`📨 ${req.method} ${req.url}`);
    console.log('🕐 Time:', new Date().toISOString());
    console.log('📍 From IP:', req.ip);
    console.log('📦 Body:', JSON.stringify(req.body, null, 2));
    console.log('='.repeat(50));
    next();
});

// Configuración de la base de datos PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test database connection
const testDatabaseConnection = async () => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        console.log('✅ Database connected at:', result.rows[0].now);
        client.release();
    } catch (err) {
        console.error('❌ Error connecting to database:', err.stack);
    }
};

pool.on('error', (err, client) => {
    console.error('❌ Unexpected error on idle client', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
});

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token == null) return res.sendStatus(401);
    
    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Middleware de autorización para administradores
const authorizeAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.sendStatus(403);
    }
    next();
};

// ============================================
// RUTAS DE AUTENTICACIÓN
// ============================================

app.post('/api/auth/register', async (req, res) => {
    console.log('='.repeat(50));
    console.log('📥 REGISTER ENDPOINT HIT');
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
    console.log('='.repeat(50));
    
    const { username, password, role } = req.body;
    
    try {
        if (!username || !password) {
            console.log('❌ Validation failed: Missing username or password');
            return res.status(400).json({ message: 'Username and password are required' });
        }
        
        console.log('✅ Validation passed');
        console.log('👤 Username:', username);
        console.log('🔐 Role:', role || 'employee');
        console.log('🔑 Password length:', password.length);
        
        console.log('🔐 Starting bcrypt hash...');
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('✅ Password hashed successfully, hash length:', hashedPassword.length);
        
        console.log('💾 Attempting database insert...');
        console.log('📝 SQL: INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)');
        console.log('📝 Values:', [username, '***HIDDEN***', role || 'employee']);
        
        const result = await pool.query(
            'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role',
            [username, hashedPassword, role || 'employee']
        );
        
        console.log('✅ SUCCESS! User created:', result.rows[0]);
        console.log('='.repeat(50));
        
        res.status(201).json(result.rows[0]);
        
    } catch (error) {
        console.log('='.repeat(50));
        console.error('❌❌❌ ERROR REGISTERING USER ❌❌❌');
        console.error('📛 Error name:', error.name);
        console.error('📛 Error code:', error.code);
        console.error('📛 Error message:', error.message);
        console.error('📛 Error detail:', error.detail);
        console.error('📛 Error hint:', error.hint);
        console.error('📛 Full error stack:', error.stack);
        console.log('='.repeat(50));
        
        if (error.code === '23505') {
            console.log('⚠️  Duplicate key violation');
            return res.status(409).json({ 
                message: 'Username already exists',
                code: error.code
            });
        }
        
        if (error.code === '42P01') {
            console.log('⚠️  Table does not exist');
            return res.status(500).json({ 
                message: 'Database table "users" does not exist. Please create it.',
                code: error.code,
                details: error.message
            });
        }
        
        if (error.code === '42703') {
            console.log('⚠️  Column does not exist');
            return res.status(500).json({ 
                message: 'Database column does not exist. Check table structure.',
                code: error.code,
                details: error.message
            });
        }
        
        if (error.code === '23502') {
            console.log('⚠️  NULL value in NOT NULL column');
            return res.status(500).json({ 
                message: 'Missing required field',
                code: error.code,
                details: error.message
            });
        }
        
        res.status(500).json({ 
            message: 'Error registering user',
            details: error.message,
            code: error.code || 'UNKNOWN'
        });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];
        
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role }, 
            jwtSecret, 
            { expiresIn: '24h' }
        );
        
        res.json({ 
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                uuid: user.id // Add UUID field for frontend
            }
        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'Error logging in' });
    }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, username, role FROM users WHERE id = $1',
            [req.user.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Error fetching user' });
    }
});

// ============================================
// RUTAS CRUD PARA PRODUCTOS
// ============================================

app.get('/api/products', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Error fetching products' });
    }
});

app.get('/api/products/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ message: 'Error fetching product' });
    }
});

app.get('/api/products/barcode/:code', authenticateToken, async (req, res) => {
    const { code } = req.params;
    try {
        const result = await pool.query('SELECT * FROM products WHERE code = $1', [code]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching product by barcode:', error);
        res.status(500).json({ message: 'Error fetching product' });
    }
});

app.post('/api/products', authenticateToken, authorizeAdmin, async (req, res) => {
    const { name, code, purchase_price, sale_price, stock, provider_id, category, image_url } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO products (name, code, purchase_price, sale_price, stock, provider_id, category, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [name, code, purchase_price, sale_price, stock, provider_id, category, image_url]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Error creating product' });
    }
});

app.put('/api/products/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, code, purchase_price, sale_price, stock, provider_id, category, image_url } = req.body;
    try {
        const result = await pool.query(
            'UPDATE products SET name = $1, code = $2, purchase_price = $3, sale_price = $4, stock = $5, provider_id = $6, category = $7, image_url = $8 WHERE id = $9 RETURNING *',
            [name, code, purchase_price, sale_price, stock, provider_id, category, image_url, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Error updating product' });
    }
});

app.delete('/api/products/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json({ message: 'Product deleted successfully', product: result.rows[0] });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Error deleting product' });
    }
});

// ============================================
// RUTAS CRUD PARA PROVEEDORES
// ============================================

app.get('/api/providers', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM providers ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching providers:', error);
        res.status(500).json({ message: 'Error fetching providers' });
    }
});

app.get('/api/providers/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM providers WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Provider not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching provider:', error);
        res.status(500).json({ message: 'Error fetching provider' });
    }
});

app.post('/api/providers', authenticateToken, authorizeAdmin, async (req, res) => {
    const { name, contact_info } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO providers (name, contact_info) VALUES ($1, $2) RETURNING *',
            [name, contact_info]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating provider:', error);
        res.status(500).json({ message: 'Error creating provider' });
    }
});

app.put('/api/providers/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, contact_info } = req.body;
    try {
        const result = await pool.query(
            'UPDATE providers SET name = $1, contact_info = $2 WHERE id = $3 RETURNING *',
            [name, contact_info, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Provider not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating provider:', error);
        res.status(500).json({ message: 'Error updating provider' });
    }
});

app.delete('/api/providers/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM providers WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Provider not found' });
        }
        res.json({ message: 'Provider deleted successfully', provider: result.rows[0] });
    } catch (error) {
        console.error('Error deleting provider:', error);
        res.status(500).json({ message: 'Error deleting provider' });
    }
});

// ============================================
// RUTAS PARA VENTAS
// ============================================

app.post('/api/sales', authenticateToken, async (req, res) => {
    const { payment_method, items, total_amount } = req.body;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Always get the actual UUID from the database for the user
        // The JWT contains the UUID, but we need to make sure it's the right format
        let userId;
        
        // Use the user ID directly from JWT (should be integer now)
        userId = req.user.id;
        
        console.log('Using user ID from JWT:', userId, 'Type:', typeof userId);
        
        console.log('Creating sale with user_id:', userId);
        console.log('User from JWT:', req.user);
        console.log('Total amount from frontend:', total_amount);
        
        const saleResult = await client.query(
            'INSERT INTO sales (user_id, payment_method, total_amount) VALUES ($1, $2, $3) RETURNING id, sale_date',
            [userId, payment_method || 'cash', total_amount || 0]
        );
        const saleId = saleResult.rows[0].id;
        
        for (const item of items) {
            const productResult = await client.query(
                'SELECT id, sale_price, stock FROM products WHERE id = $1',
                [item.product_id]
            );
            const product = productResult.rows[0];
            
            if (!product || product.stock < item.quantity) {
                throw new Error(`Product ${item.product_id} is out of stock or insufficient quantity.`);
            }
            
            await client.query(
                'INSERT INTO sale_items (sale_id, product_id, quantity, price_at_sale) VALUES ($1, $2, $3, $4)',
                [saleId, item.product_id, item.quantity, product.sale_price]
            );
            
            await client.query(
                'UPDATE products SET stock = stock - $1 WHERE id = $2',
                [item.quantity, item.product_id]
            );
        }
        await client.query('COMMIT');
        
        const responseData = { 
            message: 'Sale registered successfully', 
            id: saleId,
            saleId, 
            total_amount: total_amount || 0,
            sale_date: saleResult.rows[0].sale_date
        };
        
        console.log('Sale completed successfully:', responseData);
        res.status(201).json(responseData);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error registering sale:', error);
        res.status(500).json({ message: error.message || 'Error registering sale' });
    } finally {
        client.release();
    }
});

app.get('/api/sales', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT s.*, u.username 
            FROM sales s 
            JOIN users u ON s.user_id = u.id 
            ORDER BY s.sale_date DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching sales:', error);
        res.status(500).json({ message: 'Error fetching sales' });
    }
});

app.get('/api/sales/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const saleResult = await pool.query(`
            SELECT s.*, u.username 
            FROM sales s 
            JOIN users u ON s.user_id = u.id 
            WHERE s.id = $1
        `, [id]);
        
        if (saleResult.rows.length === 0) {
            return res.status(404).json({ message: 'Sale not found' });
        }
        
        const itemsResult = await pool.query(`
            SELECT si.*, p.name as product_name 
            FROM sale_items si 
            JOIN products p ON si.product_id = p.id 
            WHERE si.sale_id = $1
        `, [id]);
        
        res.json({
            ...saleResult.rows[0],
            items: itemsResult.rows
        });
    } catch (error) {
        console.error('Error fetching sale:', error);
        res.status(500).json({ message: 'Error fetching sale' });
    }
});

// ============================================
// RUTAS ADICIONALES
// ============================================

app.get('/api/protected', authenticateToken, (req, res) => {
    res.json({ message: `Welcome ${req.user.username}! You have access to protected data.` });
});

app.get('/', (req, res) => {
    res.json({ 
        message: 'Backend POS API is running!',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            products: '/api/products',
            providers: '/api/providers',
            sales: '/api/sales'
        }
    });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

// Primero conectar a la base de datos
testDatabaseConnection().then(() => {
    // Luego iniciar el servidor
    const server = app.listen(port, '0.0.0.0', () => {
        const os = require('os');
        const networkInterfaces = os.networkInterfaces();
        const addresses = [];
        
        for (const interfaceName in networkInterfaces) {
            for (const net of networkInterfaces[interfaceName]) {
                if (net.family === 'IPv4' && !net.internal) {
                    addresses.push({ name: interfaceName, address: net.address });
                }
            }
        }
        
        console.log('='.repeat(60));
        console.log('🚀 Server running on http://0.0.0.0:' + port);
        console.log('='.repeat(60));
        console.log('📡 Accessible from these network addresses:');
        addresses.forEach(addr => {
            console.log(`   ${addr.name}: http://${addr.address}:${port}`);
        });
        console.log('='.repeat(60));
        console.log('👂 Server is listening and ready to receive requests...');
        console.log('='.repeat(60));
    });

    // Manejo de cierre graceful
    process.on('SIGTERM', () => {
        console.log('👋 SIGTERM signal received: closing HTTP server');
        server.close(() => {
            console.log('💤 HTTP server closed');
            pool.end(() => {
                console.log('💤 Database pool closed');
                process.exit(0);
            });
        });
    });

    process.on('SIGINT', () => {
        console.log('\n👋 SIGINT signal received: closing HTTP server');
        server.close(() => {
            console.log('💤 HTTP server closed');
            pool.end(() => {
                console.log('💤 Database pool closed');
                process.exit(0);
            });
        });
    });
});