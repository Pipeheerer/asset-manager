-- FRESH DATABASE SETUP
-- Run this in Supabase SQL Editor
-- It safely handles existing tables and policies

-- =====================
-- STEP 1: DROP ALL EXISTING POLICIES
-- =====================
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- =====================
-- STEP 2: CREATE TABLES (if not exist)
-- =====================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assets table
CREATE TABLE IF NOT EXISTS assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id),
  date_purchased DATE NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  department_id UUID REFERENCES departments(id),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- STEP 3: DISABLE RLS TEMPORARILY (for easier setup)
-- =====================
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE assets DISABLE ROW LEVEL SECURITY;

-- =====================
-- STEP 4: INSERT DEFAULT DATA
-- =====================

-- Default categories
INSERT INTO categories (name) VALUES 
  ('Laptop'), ('Desktop'), ('Monitor'), ('Phone'), ('Tablet'),
  ('Printer'), ('Server'), ('Network Equipment'), ('Software'), ('Other')
ON CONFLICT (name) DO NOTHING;

-- Default departments
INSERT INTO departments (name) VALUES 
  ('IT'), ('HR'), ('Finance'), ('Marketing'), ('Sales'),
  ('Operations'), ('Customer Service'), ('Executive'), ('R&D'), ('Other')
ON CONFLICT (name) DO NOTHING;

-- =====================
-- STEP 5: VERIFY SETUP
-- =====================
SELECT 'Setup Complete!' as status;
SELECT 'Tables created:' as info;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users', 'categories', 'departments', 'assets');
SELECT 'Categories count: ' || COUNT(*)::text as info FROM categories;
SELECT 'Departments count: ' || COUNT(*)::text as info FROM departments;
