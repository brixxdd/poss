-- Add missing columns to users table for Render deployment
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Update existing users to have default status
UPDATE users SET status = 'active' WHERE status IS NULL;
