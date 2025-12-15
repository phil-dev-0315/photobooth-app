-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  event_date DATE,
  event_type TEXT, -- wedding, birthday, christening, corporate, other
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  layout_type TEXT NOT NULL, -- '3-vertical', '2x2', 'single', etc.
  frame_url TEXT, -- Supabase Storage URL
  include_message BOOLEAN DEFAULT false,
  include_logo BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Captured photo sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  session_code TEXT UNIQUE, -- Short code for QR/URL
  message TEXT,
  composite_url TEXT, -- Final strip image URL
  is_printed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual photos in a session
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL, -- Supabase Storage URL
  photo_order INTEGER NOT NULL, -- 1, 2, 3...
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_events_is_active ON events(is_active);
CREATE INDEX IF NOT EXISTS idx_sessions_event_id ON sessions(event_id);
CREATE INDEX IF NOT EXISTS idx_sessions_session_code ON sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_photos_session_id ON photos(session_id);
CREATE INDEX IF NOT EXISTS idx_event_layouts_event_id ON event_layouts(event_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for events table
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Events: Public can read active events, authenticated users can do everything
CREATE POLICY "Public can view active events"
  ON events FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage events"
  ON events FOR ALL
  USING (auth.role() = 'authenticated');

-- Event layouts: Public can read, authenticated can manage
CREATE POLICY "Public can view event layouts"
  ON event_layouts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage event layouts"
  ON event_layouts FOR ALL
  USING (auth.role() = 'authenticated');

-- Sessions: Public can read with session_code, authenticated can manage
CREATE POLICY "Public can view sessions by code"
  ON sessions FOR SELECT
  USING (session_code IS NOT NULL);

CREATE POLICY "Authenticated users can manage sessions"
  ON sessions FOR ALL
  USING (auth.role() = 'authenticated');

-- Photos: Public can read photos from public sessions, authenticated can manage
CREATE POLICY "Public can view photos from public sessions"
  ON photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = photos.session_id
      AND sessions.session_code IS NOT NULL
    )
  );

CREATE POLICY "Authenticated users can manage photos"
  ON photos FOR ALL
  USING (auth.role() = 'authenticated');
