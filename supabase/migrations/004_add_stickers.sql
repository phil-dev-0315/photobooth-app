-- Migration: Add stickers support
-- Run this in Supabase SQL Editor

-- 1. Add stickers_enabled column to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS stickers_enabled BOOLEAN DEFAULT false;

-- 2. Create stickers table
CREATE TABLE IF NOT EXISTS stickers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  category VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_stickers_event_id ON stickers(event_id);

-- 4. Enable RLS on stickers table
ALTER TABLE stickers ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for stickers
-- Allow public read access (for displaying stickers in the app)
CREATE POLICY "Allow public read access to stickers"
ON stickers FOR SELECT
TO public
USING (true);

-- Allow authenticated users to insert stickers (admin only via service role)
CREATE POLICY "Allow service role to insert stickers"
ON stickers FOR INSERT
TO service_role
WITH CHECK (true);

-- Allow service role to update stickers
CREATE POLICY "Allow service role to update stickers"
ON stickers FOR UPDATE
TO service_role
USING (true);

-- Allow service role to delete stickers
CREATE POLICY "Allow service role to delete stickers"
ON stickers FOR DELETE
TO service_role
USING (true);

-- 6. Create storage bucket for stickers (run separately in Storage settings or use this)
-- Note: This needs to be done in Supabase Dashboard > Storage > Create new bucket
-- Bucket name: stickers
-- Public bucket: Yes

-- Alternative: Insert into storage.buckets if you have access
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('stickers', 'stickers', true)
-- ON CONFLICT (id) DO NOTHING;
