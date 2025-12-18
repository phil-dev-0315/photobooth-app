# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Photobooth App is a mobile-first web application for event photography (weddings, birthdays, corporate events). Guests capture photos, apply decorative frames/stickers, add messages, and generate composite images for printing or downloading.

## Development Commands

```bash
npm run dev           # Start dev server on localhost:3000
npm run dev:network   # Start on 0.0.0.0 with HTTPS (for mobile/LAN testing)
npm run build         # Build for production
npm run start         # Start production server
npm run lint          # Run ESLint
```

## Tech Stack

- **Framework:** Next.js 16+ (App Router) with TypeScript
- **Styling:** Tailwind CSS v4
- **Animations:** Framer Motion
- **Canvas/Compositing:** Konva.js with react-konva + html-to-image for export
- **Database & Storage:** Supabase (PostgreSQL + Storage buckets)
- **Email:** Resend API

## Architecture

### State Management
- **SessionContext** (`contexts/SessionContext.tsx`): Global session state managing `eventId`, `event`, `photos`, and `message`
- Use `useSession()` for general session access
- Use `useCaptureSession()` for capture-specific utilities with photo count tracking

### Key Data Flow
1. Landing page loads active event via `/api/events?active=true`
2. User enters security code (if enabled via `security_code_enabled`)
3. Camera capture stores photos in SessionContext as base64 data URLs
4. Review page uses PhotoCompositor (Konva canvas) for compositing
5. Final composite exported via html-to-image, uploaded to Supabase storage
6. Session saved to database with composite URL

### Canvas Architecture
- `PhotoCompositor.tsx` uses react-konva (NOT direct HTML5 canvas)
- Renders layers: frame background → photos in placeholders → overlays → stickers → text
- Stickers have transform handles for user manipulation
- Photo placeholders defined in `EventLayout.placeholders[]`

### Authentication
- Admin routes protected by middleware (`middleware.ts`)
- Cookie-based auth via `/api/admin/login`
- Admin password in `ADMIN_PASSWORD` env var

### Database
- Tables: `events`, `event_layouts`, `sessions`, `photos`, `stickers`
- Storage buckets: `frames`, `logos`, `photos`, `composites`, `stickers`
- RLS policies control access (see `supabase/SETUP.md`)

## Key Types (types/index.ts)

- `Event`: Event configuration (photos_per_session, countdown_seconds, message settings, security code)
- `EventLayout`: Layout template with frame_url, dimensions, placeholders[], overlays[]
- `Session`: Capture session with session_code, message, composite_url
- `Photo`: Individual photo with photo_url and photo_order
- `CapturedPhoto`: Client-side photo before upload (id, dataUrl, timestamp)
- `PlacedSticker`: Sticker instance on canvas (position, rotation, scale)

## API Routes

- `GET /api/events?active=true` - Get active event
- `POST /api/sessions` - Create new session
- `POST /api/upload-asset` - Upload files (frames, logos, stickers, photos)
- `POST /api/send-email` - Send session link via Resend
- `GET/POST /api/event-layouts` - Layout configuration
- `GET/POST /api/stickers` - Sticker management

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Client-side Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Admin operations
- `ADMIN_PASSWORD` - Admin panel access
- `NEXT_PUBLIC_APP_URL` - App URL for QR codes/links
- `RESEND_API_KEY` - Email service (optional)
