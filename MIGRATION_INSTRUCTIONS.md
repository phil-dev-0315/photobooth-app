# Database Migration Instructions

## Run All Migrations

Run the following SQL in your Supabase SQL Editor to apply all migrations:

```sql
-- Migration 002: Add width and height columns
ALTER TABLE event_layouts
ADD COLUMN IF NOT EXISTS width INTEGER DEFAULT 1080,
ADD COLUMN IF NOT EXISTS height INTEGER DEFAULT 1920;

COMMENT ON COLUMN event_layouts.width IS 'Output width in pixels for this layout';
COMMENT ON COLUMN event_layouts.height IS 'Output height in pixels for this layout';

-- Migration 003: Add placeholders JSON column
ALTER TABLE event_layouts
ADD COLUMN IF NOT EXISTS placeholders JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN event_layouts.placeholders IS 'JSON array of placeholder rectangles for photo placement';
```

## What This Enables:

### Layout Dimensions (width, height)
- `width` - Output width in pixels (default: 1080)
- `height` - Output height in pixels (default: 1920)
- Controls the final composite image size

### Photo Placeholders (placeholders)
- JSON array defining where photos will be placed on the frame
- Each placeholder has: `x`, `y`, `width`, `height`
- Photos are cropped to fill each placeholder while maintaining aspect ratio

Example placeholders JSON:
```json
[
  { "x": 60, "y": 200, "width": 960, "height": 720 },
  { "x": 60, "y": 940, "width": 960, "height": 720 },
  { "x": 60, "y": 1680, "width": 960, "height": 720 }
]
```

## After Migration:

1. Go to Admin > Events > [Event] > Assets
2. Upload a frame image
3. Define photo placeholders by:
   - Drawing rectangles on the preview, OR
   - Clicking "Auto-Generate" for automatic placement
4. Adjust dimensions if needed
5. Save the frame

Photos will now be cropped to perfectly fill each placeholder!
