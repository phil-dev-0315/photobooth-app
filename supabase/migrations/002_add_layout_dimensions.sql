-- Add width and height columns to event_layouts table
ALTER TABLE event_layouts
ADD COLUMN IF NOT EXISTS width INTEGER DEFAULT 1080,
ADD COLUMN IF NOT EXISTS height INTEGER DEFAULT 1920;

-- Add comment to explain the columns
COMMENT ON COLUMN event_layouts.width IS 'Output width in pixels for this layout';
COMMENT ON COLUMN event_layouts.height IS 'Output height in pixels for this layout';
