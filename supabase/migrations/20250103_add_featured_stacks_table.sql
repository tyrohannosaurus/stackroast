-- Migration: Add featured_stacks table for native sponsorships
-- This migration adds support for featured/sponsored stacks

-- Create featured_stacks table
CREATE TABLE IF NOT EXISTS featured_stacks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stack_id UUID REFERENCES stacks(id) ON DELETE CASCADE,
  sponsor_name TEXT NOT NULL,
  sponsor_logo_url TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL,
  cta_text TEXT DEFAULT 'View Stack',
  priority INT DEFAULT 1,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_featured_stacks_active 
ON featured_stacks(active, start_date, end_date) 
WHERE active = TRUE;

CREATE INDEX IF NOT EXISTS idx_featured_stacks_priority 
ON featured_stacks(priority DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_featured_stacks_dates 
ON featured_stacks(start_date, end_date);

-- Enable Row Level Security (RLS)
ALTER TABLE featured_stacks ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view active featured stacks
CREATE POLICY "Anyone can view active featured stacks"
ON featured_stacks
FOR SELECT
TO public
USING (active = TRUE AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE);

-- Policy: Only authenticated admins can insert (adjust based on your auth setup)
-- For now, we'll allow authenticated users to insert (you can restrict this later)
CREATE POLICY "Authenticated users can insert featured stacks"
ON featured_stacks
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Only authenticated users can update their own featured stacks
CREATE POLICY "Authenticated users can update featured stacks"
ON featured_stacks
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_featured_stacks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_featured_stacks_updated_at
BEFORE UPDATE ON featured_stacks
FOR EACH ROW
EXECUTE FUNCTION update_featured_stacks_updated_at();

-- Create featured_stack_clicks table for tracking
CREATE TABLE IF NOT EXISTS featured_stack_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  featured_stack_id UUID REFERENCES featured_stacks(id) ON DELETE CASCADE,
  stack_id UUID REFERENCES stacks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  clicked_at TIMESTAMP DEFAULT NOW(),
  referrer TEXT,
  user_agent TEXT
);

-- Create indexes for analytics
CREATE INDEX IF NOT EXISTS idx_featured_clicks_featured_stack 
ON featured_stack_clicks(featured_stack_id);

CREATE INDEX IF NOT EXISTS idx_featured_clicks_stack 
ON featured_stack_clicks(stack_id);

CREATE INDEX IF NOT EXISTS idx_featured_clicks_clicked_at 
ON featured_stack_clicks(clicked_at);

-- Enable RLS for clicks table
ALTER TABLE featured_stack_clicks ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert clicks (for tracking)
CREATE POLICY "Anyone can insert featured stack clicks"
ON featured_stack_clicks
FOR INSERT
TO public
WITH CHECK (true);

-- Policy: Authenticated users can view their own clicks
CREATE POLICY "Users can view their own clicks"
ON featured_stack_clicks
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Add comments for documentation
COMMENT ON TABLE featured_stacks IS 'Stores featured/sponsored stacks for display on homepage and stack pages';
COMMENT ON COLUMN featured_stacks.priority IS 'Higher priority stacks appear first (1 = highest priority)';
COMMENT ON COLUMN featured_stacks.sponsor_name IS 'Name of the sponsor/advertiser';
COMMENT ON COLUMN featured_stacks.sponsor_logo_url IS 'URL to sponsor logo image';
COMMENT ON TABLE featured_stack_clicks IS 'Tracks clicks on featured stacks for analytics';
