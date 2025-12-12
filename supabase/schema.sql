-- Photobooth App Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  event_date DATE,
  event_type TEXT CHECK (event_type IN ('wedding', 'birthday', 'christening', 'corporate', 'other')),
  is_active BOOLEAN DEFAULT false,
  photos_per_session INTEGER DEFAULT 3,
  countdown_seconds INTEGER DEFAULT 8,
  message_enabled BOOLEAN DEFAULT false,
  message_char_limit INTEGER DEFAULT 100,
  default_layout TEXT DEFAULT '3-vertical',
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Layout configurations per event
CREATE TABLE IF NOT EXISTS event_layouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  layout_type TEXT NOT NULL CHECK (layout_type IN ('3-vertical', '2x2', 'single', '4-strip')),
  frame_url TEXT,
  include_message BOOLEAN DEFAULT false,
  include_logo BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Captured photo sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  session_code TEXT UNIQUE,
  message TEXT,
  composite_url TEXT,
  is_printed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual photos in a session
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_events_is_active ON events(is_active);
CREATE INDEX IF NOT EXISTS idx_event_layouts_event_id ON event_layouts(event_id);
CREATE INDEX IF NOT EXISTS idx_sessions_event_id ON sessions(event_id);
CREATE INDEX IF NOT EXISTS idx_sessions_session_code ON sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_photos_session_id ON photos(session_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for events table
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate short session codes
CREATE OR REPLACE FUNCTION generate_session_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate session code
CREATE OR REPLACE FUNCTION set_session_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.session_code IS NULL THEN
    NEW.session_code := generate_session_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_session_code_trigger ON sessions;
CREATE TRIGGER set_session_code_trigger
  BEFORE INSERT ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION set_session_code();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Events policies (public read for active events, service role for write)
CREATE POLICY "Public can read active events" ON events
  FOR SELECT USING (is_active = true);

CREATE POLICY "Service role can manage events" ON events
  FOR ALL USING (auth.role() = 'service_role');

-- Event layouts policies
CREATE POLICY "Public can read layouts for active events" ON event_layouts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = event_layouts.event_id AND events.is_active = true)
  );

CREATE POLICY "Service role can manage layouts" ON event_layouts
  FOR ALL USING (auth.role() = 'service_role');

-- Sessions policies (public can create and read their own sessions)
CREATE POLICY "Anyone can create sessions" ON sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read sessions by code" ON sessions
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage sessions" ON sessions
  FOR ALL USING (auth.role() = 'service_role');

-- Photos policies
CREATE POLICY "Anyone can insert photos" ON photos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read photos" ON photos
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage photos" ON photos
  FOR ALL USING (auth.role() = 'service_role');

-- Storage bucket creation (run these separately in Supabase dashboard or via API)
-- Note: Storage buckets need to be created via Supabase dashboard or API
/*
Storage Buckets to create:
1. frames - Public read (for frame/background assets)
2. logos - Public read (for event logos)
3. photos - Private (raw captured photos)
4. composites - Public read (final strip images for guest download)

Example bucket policies (set in Supabase dashboard):
- frames, logos, composites: Enable public access for downloads
- photos: Restrict to authenticated/service role only
*/
