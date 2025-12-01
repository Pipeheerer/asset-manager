-- ENHANCED ASSET MANAGEMENT
-- Run this in Supabase SQL Editor
-- Adds: Serial numbers, Warranty, Insurance, Assignments, Documents, Status workflow

-- =====================
-- STEP 1: ADD NEW COLUMNS TO ASSETS TABLE
-- =====================

-- Serial number for tracking
ALTER TABLE assets ADD COLUMN IF NOT EXISTS serial_number TEXT;

-- Description/notes field
ALTER TABLE assets ADD COLUMN IF NOT EXISTS description TEXT;

-- Asset status workflow: Available, Assigned, In Repair, Retired
ALTER TABLE assets ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available' 
  CHECK (status IN ('available', 'assigned', 'in_repair', 'retired'));

-- Warranty information
ALTER TABLE assets ADD COLUMN IF NOT EXISTS warranty_expiry DATE;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS warranty_notes TEXT;

-- Insurance information  
ALTER TABLE assets ADD COLUMN IF NOT EXISTS insurance_provider TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS insurance_policy_number TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS insurance_expiry DATE;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS insurance_coverage DECIMAL(10,2);

-- Assignment tracking (current assignee)
ALTER TABLE assets ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS assigned_date TIMESTAMP WITH TIME ZONE;

-- Location tracking
ALTER TABLE assets ADD COLUMN IF NOT EXISTS location TEXT;

-- =====================
-- STEP 2: CREATE ASSET ASSIGNMENTS TABLE (History)
-- =====================
CREATE TABLE IF NOT EXISTS asset_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL CHECK (action IN ('assigned', 'returned', 'transferred')),
  notes TEXT,
  assigned_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_asset_assignments_asset_id ON asset_assignments(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_assignments_user_id ON asset_assignments(user_id);

-- =====================
-- STEP 3: CREATE ASSET DOCUMENTS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS asset_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'invoice', 'warranty', 'purchase_order', 'insurance', 'manual', 'other'
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_asset_documents_asset_id ON asset_documents(asset_id);

-- =====================
-- STEP 4: CREATE STORAGE BUCKET FOR DOCUMENTS
-- =====================
-- Note: Run this separately in Supabase Dashboard > Storage
-- INSERT INTO storage.buckets (id, name, public) VALUES ('asset-documents', 'asset-documents', false);

-- =====================
-- STEP 5: CREATE SEARCH INDEX FOR ASSETS
-- =====================
-- Full text search on asset name, serial number, description
CREATE INDEX IF NOT EXISTS idx_assets_search ON assets USING gin(
  to_tsvector('english', coalesce(name, '') || ' ' || coalesce(serial_number, '') || ' ' || coalesce(description, ''))
);

-- =====================
-- STEP 6: DISABLE RLS ON NEW TABLES
-- =====================
ALTER TABLE asset_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE asset_documents DISABLE ROW LEVEL SECURITY;

-- =====================
-- STEP 7: CREATE HELPER VIEW FOR WARRANTY/INSURANCE EXPIRING SOON
-- =====================
CREATE OR REPLACE VIEW assets_expiring_soon AS
SELECT 
  a.*,
  c.name as category_name,
  d.name as department_name,
  u.email as assigned_to_email,
  CASE 
    WHEN a.warranty_expiry <= CURRENT_DATE THEN 'expired'
    WHEN a.warranty_expiry <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
    ELSE 'valid'
  END as warranty_status,
  CASE 
    WHEN a.insurance_expiry <= CURRENT_DATE THEN 'expired'
    WHEN a.insurance_expiry <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
    ELSE 'valid'
  END as insurance_status
FROM assets a
LEFT JOIN categories c ON a.category_id = c.id
LEFT JOIN departments d ON a.department_id = d.id
LEFT JOIN users u ON a.assigned_to = u.id
WHERE 
  (a.warranty_expiry IS NOT NULL AND a.warranty_expiry <= CURRENT_DATE + INTERVAL '30 days')
  OR (a.insurance_expiry IS NOT NULL AND a.insurance_expiry <= CURRENT_DATE + INTERVAL '30 days');

-- =====================
-- VERIFY SETUP
-- =====================
SELECT 'Enhanced Assets Migration Complete!' as status;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'assets' AND table_schema = 'public'
ORDER BY ordinal_position;
