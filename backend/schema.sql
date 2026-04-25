-- LinkedIn Clone PostgreSQL Schema

CREATE TABLE IF NOT EXISTS profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  headline TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  location VARCHAR(255) DEFAULT '',
  industry VARCHAR(100) DEFAULT '',
  profile_picture VARCHAR(500) DEFAULT '/uploads/default-avatar.png',
  cover_photo VARCHAR(500) DEFAULT '/uploads/default-cover.png',
  contact_info JSONB DEFAULT '{"email":"","phone":"","website":""}'::jsonb,
  social_links JSONB DEFAULT '{"linkedin":"","github":"","twitter":""}'::jsonb,
  experience JSONB DEFAULT '[]'::jsonb,
  education JSONB DEFAULT '[]'::jsonb,
  skills JSONB DEFAULT '[]'::jsonb,
  connections INTEGER DEFAULT 0,
  followers INTEGER DEFAULT 0,
  following INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  author VARCHAR(255) NOT NULL,
  author_title VARCHAR(255) DEFAULT 'Member',
  content TEXT NOT NULL,
  images JSONB DEFAULT '[]'::jsonb,
  video VARCHAR(500),
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_timestamp ON posts(timestamp DESC);
