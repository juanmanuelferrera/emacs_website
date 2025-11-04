-- Emacs Website D1 Database Schema

-- Buffers/Pages table
CREATE TABLE IF NOT EXISTS buffers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    created_by TEXT,
    is_public INTEGER DEFAULT 1  -- 1 = public, 0 = private
);

-- Users table (simple auth)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    email TEXT,
    full_name TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_buffers_name ON buffers(name);
CREATE INDEX IF NOT EXISTS idx_buffers_public ON buffers(is_public);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Insert default built-in buffers (read-only)
INSERT OR IGNORE INTO buffers (id, name, content, created_at, updated_at, is_public) VALUES
('home', 'Home', ';; Welcome - Press M-x to navigate

* Welcome

I am a Vedic scholar and software developer...', datetime('now'), datetime('now'), 1);
