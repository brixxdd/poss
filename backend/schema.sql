-- Table for Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY, -- Changed from UUID to SERIAL (auto-incrementing integer)
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'employee' -- e.g., 'admin', 'employee'
);

-- Table for Providers
CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    contact_info TEXT
);

-- Table for Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(255) UNIQUE, -- EAN/UPC
    purchase_price DECIMAL(10, 2) NOT NULL,
    sale_price DECIMAL(10, 2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    provider_id UUID REFERENCES providers(id),
    category VARCHAR(255),
    image_url TEXT
);

-- Table for Sales
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50), -- e.g., 'cash', 'card'
    user_id INTEGER REFERENCES users(id) -- Changed from UUID to INTEGER
);

-- Table for Sale Items (to link Sales and Products)
CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID REFERENCES sales(id),
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price_at_sale DECIMAL(10, 2) NOT NULL
);
