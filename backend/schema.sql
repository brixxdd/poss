-- Table for Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'employee', -- e.g., 'admin', 'employee'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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
    reorder_threshold INTEGER DEFAULT 0, -- Added for stock alerts
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
    user_id UUID REFERENCES users(id)
);

-- Table for Sale Items (to link Sales and Products)
CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID REFERENCES sales(id),
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price_at_sale DECIMAL(10, 2) NOT NULL
);

-- Table for Stock Alerts
CREATE TABLE stock_alerts (
    id SERIAL PRIMARY KEY,
    product_id UUID REFERENCES products(id),
    alert_type VARCHAR(50), -- e.g., "low_stock", "will_stockout"
    severity SMALLINT, -- 1=low, 2=medium, 3=high
    predicted_out_date DATE,
    days_until_stockout INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    resolved BOOLEAN DEFAULT FALSE
);

-- Table for Model Metrics
CREATE TABLE model_metrics (
    id SERIAL PRIMARY KEY,
    model_version TEXT NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    horizon INTEGER NOT NULL,
    mae FLOAT NOT NULL,
    rmse FLOAT NOT NULL,
    evaluated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (product_id, model_version, horizon, evaluated_at)
);

-- Table for Analytics Jobs
CREATE TABLE analytics_jobs (
    id SERIAL PRIMARY KEY,
    job_name TEXT NOT NULL,
    status TEXT NOT NULL,
    started_at TIMESTAMP,
    finished_at TIMESTAMP,
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table for Sales Predictions
CREATE TABLE sales_predictions (
    id SERIAL PRIMARY KEY,
    product_id UUID REFERENCES products(id),
    horizon_days INTEGER,
    predicted_qty INTEGER,
    prediction_date DATE,
    model_version TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (product_id, prediction_date, model_version)
);