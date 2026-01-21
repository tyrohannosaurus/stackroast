-- Email preferences table
CREATE TABLE IF NOT EXISTS email_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  welcome BOOLEAN DEFAULT true,
  roast_notification BOOLEAN DEFAULT true,
  friend_roast_complete BOOLEAN DEFAULT true,
  weekly_digest BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email logs table for tracking sent emails
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  email_type TEXT NOT NULL,
  success BOOLEAN DEFAULT false,
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Roast invites table for "Roast a Friend" feature
CREATE TABLE IF NOT EXISTS roast_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_name TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  custom_message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  stack_id UUID REFERENCES stacks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_email_preferences_user_id ON email_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_email ON email_logs(email);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_roast_invites_code ON roast_invites(code);
CREATE INDEX IF NOT EXISTS idx_roast_invites_sender_id ON roast_invites(sender_id);
CREATE INDEX IF NOT EXISTS idx_roast_invites_status ON roast_invites(status);

-- RLS policies
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE roast_invites ENABLE ROW LEVEL SECURITY;

-- Users can read/write their own email preferences
CREATE POLICY "Users can manage own email preferences" ON email_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Email logs are admin-only (no public access)
-- Service role will be used to insert logs

-- Roast invites - anyone can read by code, users can create
CREATE POLICY "Anyone can read roast invites by code" ON roast_invites
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create roast invites" ON roast_invites
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL OR sender_id IS NULL);

CREATE POLICY "Users can update their own invites" ON roast_invites
  FOR UPDATE USING (auth.uid() = sender_id OR sender_id IS NULL);
