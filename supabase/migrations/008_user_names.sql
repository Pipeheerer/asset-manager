-- Migration: Add first_name, last_name, and department_id to users table
-- This allows personalized greetings and department assignment

-- Add name columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Add department reference to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_names ON users(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department_id);

-- Update RLS policy to allow users to update their own name
DROP POLICY IF EXISTS "Users can update their own name" ON users;
CREATE POLICY "Users can update their own name" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow admins to update any user
DROP POLICY IF EXISTS "Admins can update any user" ON users;
CREATE POLICY "Admins can update any user" ON users
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Allow admins to delete any user (except themselves - handled in app logic)
DROP POLICY IF EXISTS "Admins can delete users" ON users;
CREATE POLICY "Admins can delete users" ON users
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Comment for documentation
COMMENT ON COLUMN users.first_name IS 'User''s first name for personalized greetings';
COMMENT ON COLUMN users.last_name IS 'User''s last name for personalized greetings';
