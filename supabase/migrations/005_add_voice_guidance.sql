-- Migration: Add voice guidance support
-- Run this in Supabase SQL Editor

-- Add voice_guidance_enabled column to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS voice_guidance_enabled BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN events.voice_guidance_enabled IS 'Enable voice guidance/audio instructions during capture (uses Web Speech API)';
