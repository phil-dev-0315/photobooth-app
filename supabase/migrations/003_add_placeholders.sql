-- Add placeholders JSON column to event_layouts table
-- This stores an array of placeholder rectangles where photos will be placed
ALTER TABLE event_layouts
ADD COLUMN IF NOT EXISTS placeholders JSONB DEFAULT '[]'::jsonb;

-- Example placeholder format:
-- [
--   { "x": 60, "y": 200, "width": 960, "height": 720 },
--   { "x": 60, "y": 940, "width": 960, "height": 720 },
--   { "x": 60, "y": 1680, "width": 960, "height": 720 }
-- ]

COMMENT ON COLUMN event_layouts.placeholders IS 'JSON array of placeholder rectangles for photo placement. Each has x, y, width, height properties.';
