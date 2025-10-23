-- Insert sample users
INSERT INTO users (username, password_hash, role) VALUES
    ('admin', 'hashed_password_admin', 'admin'),
    ('employee1', 'hashed_password_employee1', 'employee');

-- Insert sample providers
INSERT INTO providers (name, contact_info) VALUES
    ('Proveedor A', 'contactoA@example.com'),
    ('Proveedor B', 'contactoB@example.com');

-- Insert sample products (assuming UUIDs are generated automatically)
INSERT INTO products (name, code, purchase_price, sale_price, stock, provider_id, category, image_url) VALUES
    ('Leche Entera', '750100000001', 15.00, 20.00, 100, (SELECT id FROM providers WHERE name = 'Proveedor A'), 'Lácteos', 'http://example.com/leche.jpg'),
    ('Pan Blanco', '750100000002', 20.00, 28.00, 50, (SELECT id FROM providers WHERE name = 'Proveedor B'), 'Panadería', 'http://example.com/pan.jpg'),
    ('Refresco Cola', '750100000003', 12.50, 18.00, 200, (SELECT id FROM providers WHERE name = 'Proveedor A'), 'Bebidas', 'http://example.com/refresco.jpg'),
    ('Galletas Surtidas', '750100000004', 18.00, 25.00, 75, (SELECT id FROM providers WHERE name = 'Proveedor B'), 'Snacks', 'http://example.com/galletas.jpg');

-- Note: Sales and Sale_Items will be populated through the application logic.
-- You can add sample sales here if needed for initial testing, but ensure user_id and product_id references are valid.
