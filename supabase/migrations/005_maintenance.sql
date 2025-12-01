-- Create maintenance table
CREATE TABLE IF NOT EXISTS maintenance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  maintenance_type VARCHAR(50) NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'repair', 'inspection'
  description TEXT,
  cost DECIMAL(10, 2) DEFAULT 0,
  scheduled_date DATE NOT NULL,
  completed_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'overdue'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_maintenance_asset_id ON maintenance(asset_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_scheduled_date ON maintenance(scheduled_date);

-- Add last_maintenance_date to assets table
ALTER TABLE assets ADD COLUMN IF NOT EXISTS last_maintenance_date DATE;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS next_maintenance_date DATE;

-- Function to update asset maintenance dates
CREATE OR REPLACE FUNCTION update_asset_maintenance_dates()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.completed_date IS NOT NULL THEN
    UPDATE assets 
    SET 
      last_maintenance_date = NEW.completed_date,
      next_maintenance_date = NEW.completed_date + INTERVAL '2 months'
    WHERE id = NEW.asset_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update asset maintenance dates
DROP TRIGGER IF EXISTS trigger_update_maintenance_dates ON maintenance;
CREATE TRIGGER trigger_update_maintenance_dates
  AFTER INSERT OR UPDATE ON maintenance
  FOR EACH ROW
  EXECUTE FUNCTION update_asset_maintenance_dates();

-- Function to check for overdue maintenance
CREATE OR REPLACE FUNCTION check_overdue_maintenance()
RETURNS void AS $$
BEGIN
  UPDATE maintenance 
  SET status = 'overdue'
  WHERE status = 'pending' 
    AND scheduled_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;
