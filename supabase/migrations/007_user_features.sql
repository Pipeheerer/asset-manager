-- Migration: User Dashboard Features
-- Tables for asset requests and issue reports

-- ================================================
-- Asset Requests Table
-- Users can request new assets, admins manage them
-- ================================================
CREATE TABLE IF NOT EXISTS asset_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_type VARCHAR(50) NOT NULL DEFAULT 'new', -- 'new', 'replacement', 'upgrade', 'transfer'
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    justification TEXT, -- Business reason for the request
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'denied', 'fulfilled', 'cancelled'
    admin_notes TEXT, -- Notes from admin on decision
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    fulfilled_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL, -- Link to assigned asset when fulfilled
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- Issue Reports Table  
-- Users report problems with their assets
-- ================================================
CREATE TABLE IF NOT EXISTS issue_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    issue_type VARCHAR(50) NOT NULL, -- 'damage', 'malfunction', 'loss', 'theft', 'maintenance', 'other'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed', 'cancelled'
    resolution_notes TEXT,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- Indexes for performance
-- ================================================
CREATE INDEX IF NOT EXISTS idx_asset_requests_user_id ON asset_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_asset_requests_status ON asset_requests(status);
CREATE INDEX IF NOT EXISTS idx_asset_requests_created_at ON asset_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_issue_reports_user_id ON issue_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_issue_reports_asset_id ON issue_reports(asset_id);
CREATE INDEX IF NOT EXISTS idx_issue_reports_status ON issue_reports(status);
CREATE INDEX IF NOT EXISTS idx_issue_reports_created_at ON issue_reports(created_at DESC);

-- ================================================
-- RLS Policies for asset_requests
-- ================================================
ALTER TABLE asset_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view own requests" ON asset_requests
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create requests
CREATE POLICY "Users can create requests" ON asset_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending requests (cancel)
CREATE POLICY "Users can update own pending requests" ON asset_requests
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- Admins can view all requests
CREATE POLICY "Admins can view all requests" ON asset_requests
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- Admins can update any request
CREATE POLICY "Admins can update all requests" ON asset_requests
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- ================================================
-- RLS Policies for issue_reports
-- ================================================
ALTER TABLE issue_reports ENABLE ROW LEVEL SECURITY;

-- Users can view their own reports
CREATE POLICY "Users can view own issues" ON issue_reports
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create reports for assets assigned to them
CREATE POLICY "Users can create issues" ON issue_reports
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (SELECT 1 FROM assets WHERE id = asset_id AND assigned_to = auth.uid())
    );

-- Users can update their own open reports
CREATE POLICY "Users can update own open issues" ON issue_reports
    FOR UPDATE USING (auth.uid() = user_id AND status = 'open');

-- Admins can view all reports
CREATE POLICY "Admins can view all issues" ON issue_reports
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- Admins can update any report
CREATE POLICY "Admins can update all issues" ON issue_reports
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- ================================================
-- Triggers for updated_at
-- ================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_asset_requests_updated_at ON asset_requests;
CREATE TRIGGER update_asset_requests_updated_at
    BEFORE UPDATE ON asset_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_issue_reports_updated_at ON issue_reports;
CREATE TRIGGER update_issue_reports_updated_at
    BEFORE UPDATE ON issue_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- Grant permissions
-- ================================================
GRANT ALL ON asset_requests TO authenticated;
GRANT ALL ON issue_reports TO authenticated;
