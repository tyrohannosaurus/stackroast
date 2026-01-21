-- Migration: Add saved_stacks table for user stack bookmarks
-- This migration adds support for users to save stacks and receive reminders

-- Create saved_stacks table
CREATE TABLE IF NOT EXISTS saved_stacks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  stack_id UUID REFERENCES stacks(id) ON DELETE CASCADE,
  stack_kit_id TEXT, -- For predefined kits
  custom_name TEXT,
  notes TEXT,
  saved_at TIMESTAMP DEFAULT NOW(),
  last_viewed_at TIMESTAMP,
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_scheduled_for TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, stack_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_saved_stacks_user 
ON saved_stacks(user_id);

CREATE INDEX IF NOT EXISTS idx_saved_stacks_stack 
ON saved_stacks(stack_id);

CREATE INDEX IF NOT EXISTS idx_saved_stacks_reminder 
ON saved_stacks(reminder_scheduled_for) 
WHERE NOT reminder_sent AND reminder_scheduled_for IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_saved_stacks_saved_at 
ON saved_stacks(saved_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE saved_stacks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own saved stacks
CREATE POLICY "Users can view their own saved stacks"
ON saved_stacks
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy: Users can insert their own saved stacks
CREATE POLICY "Users can insert their own saved stacks"
ON saved_stacks
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own saved stacks
CREATE POLICY "Users can update their own saved stacks"
ON saved_stacks
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own saved stacks
CREATE POLICY "Users can delete their own saved stacks"
ON saved_stacks
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_saved_stacks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_saved_stacks_updated_at
BEFORE UPDATE ON saved_stacks
FOR EACH ROW
EXECUTE FUNCTION update_saved_stacks_updated_at();

-- Function to update last_viewed_at when stack is viewed
CREATE OR REPLACE FUNCTION update_saved_stack_viewed()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE saved_stacks
  SET last_viewed_at = NOW()
  WHERE stack_id = NEW.id AND user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON TABLE saved_stacks IS 'Stores user-saved stacks for later reference and reminders';
COMMENT ON COLUMN saved_stacks.stack_kit_id IS 'Reference to predefined stack kit if this is a kit save';
COMMENT ON COLUMN saved_stacks.custom_name IS 'User-provided custom name for the saved stack';
COMMENT ON COLUMN saved_stacks.reminder_scheduled_for IS 'When to send reminder email (typically 3 days after save)';
COMMENT ON COLUMN saved_stacks.reminder_sent IS 'Whether reminder email has been sent';
