-- Migration: Add AI alternatives and click tracking tables
-- This migration adds support for AI-powered alternative suggestions and click tracking

-- Add columns to stacks table for storing AI-generated alternatives
ALTER TABLE stacks 
ADD COLUMN IF NOT EXISTS ai_alternatives JSONB,
ADD COLUMN IF NOT EXISTS alternatives_generated_at TIMESTAMP;

-- Create index for faster queries on stacks with alternatives
CREATE INDEX IF NOT EXISTS idx_stacks_alternatives_generated 
ON stacks(alternatives_generated_at) 
WHERE ai_alternatives IS NOT NULL;

-- Create alternative_clicks table for tracking affiliate clicks
CREATE TABLE IF NOT EXISTS alternative_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stack_id UUID REFERENCES stacks(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  alternative_name TEXT NOT NULL,
  affiliate_url TEXT,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  clicked_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_alternative_clicks_stack 
ON alternative_clicks(stack_id);

CREATE INDEX IF NOT EXISTS idx_alternative_clicks_user 
ON alternative_clicks(user_id);

CREATE INDEX IF NOT EXISTS idx_alternative_clicks_clicked_at 
ON alternative_clicks(clicked_at);

CREATE INDEX IF NOT EXISTS idx_alternative_clicks_tool 
ON alternative_clicks(tool_name, alternative_name);

-- Enable Row Level Security (RLS)
ALTER TABLE alternative_clicks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own clicks
CREATE POLICY "Users can insert alternative clicks"
ON alternative_clicks
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Users can view their own clicks
CREATE POLICY "Users can view their own clicks"
ON alternative_clicks
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy: Public can insert clicks (for unauthenticated users)
CREATE POLICY "Public can insert alternative clicks"
ON alternative_clicks
FOR INSERT
TO anon
WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE alternative_clicks IS 'Tracks clicks on AI-generated alternative tool suggestions for affiliate revenue tracking';
COMMENT ON COLUMN stacks.ai_alternatives IS 'JSONB storing AI-generated alternative suggestions with savings calculations';
COMMENT ON COLUMN stacks.alternatives_generated_at IS 'Timestamp when alternatives were last generated';
