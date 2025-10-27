-- Tabla para gestionar números de WhatsApp autorizados (solo admins)
-- Esto permite que solo ciertos números puedan consultar datos via WhatsApp Bot

CREATE TABLE IF NOT EXISTS whatsapp_admins (
    id SERIAL PRIMARY KEY,
    whatsapp_number VARCHAR(20) UNIQUE NOT NULL, -- Formato: 5219622566515 (código país + número)
    --user_id INTEGER REFERENCES users(id), -- por ahora no se usara
    name VARCHAR(255), -- Nombre para referencia
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índice para búsquedas rápidas por número
CREATE INDEX IF NOT EXISTS idx_whatsapp_number ON whatsapp_admins(whatsapp_number);

-- Comentario en la tabla
COMMENT ON TABLE whatsapp_admins IS 'Lista de números de WhatsApp autorizados para usar el bot de consultas (solo admins)';

-- Ejemplo de inserción (REEMPLAZA CON TU NÚMERO REAL)
-- INSERT INTO whatsapp_admins (whatsapp_number, name) VALUES ('5219622566515', 'Admin Principal');

INSERT INTO whatsapp_admins (whatsapp_number, name, active) VALUES (YOUR_NUMBER_PHONE en este formato 521xxxxxxxxxx, 'Admin Principal', true);