# Photobooth App

A mobile-first photobooth web application for events (weddings, birthdays, christenings, corporate events). Guests can take photos, apply decorative frames/backgrounds, add optional messages, and receive printed or downloadable photo strips.

## Tech Stack

- **Framework:** Next.js 16+ (App Router) with TypeScript
- **Styling:** Tailwind CSS v4
- **Animations:** Framer Motion
- **Canvas/Compositing:** Konva.js with react-konva
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage
- **Camera:** MediaDevices API

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (for database and storage)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/phil-dev-0315/photobooth-app.git
cd photobooth-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
ADMIN_PASSWORD=your-admin-password
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Set up Supabase database:
   - Create a new Supabase project
   - Run the SQL schema from `supabase/schema.sql` in the Supabase SQL Editor
   - Create storage buckets: `frames`, `logos`, `photos`, `composites`

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
/app
  /page.tsx              # Landing page
  /capture/page.tsx      # Camera capture interface
  /review/page.tsx       # Review captured photos

/components
  /capture               # Camera-related components
  /review                # Photo review components
  /ui                    # Reusable UI components

/contexts
  SessionContext.tsx     # Session state management

/hooks
  useCamera.ts           # Camera access hook
  useCountdown.ts        # Countdown timer hook

/lib
  supabase.ts            # Supabase client

/types
  index.ts               # TypeScript interfaces

/supabase
  schema.sql             # Database schema
```

## Features (Phase 1-2 Complete)

- [x] Mobile-first camera interface
- [x] Front/back camera toggle
- [x] 3-photo capture sequence with countdown
- [x] Flash effect on capture
- [x] Photo review screen
- [x] Animated transitions with Framer Motion

## Coming Soon

- [ ] Admin panel for event management
- [ ] Konva.js compositing (frames, logos, text overlays)
- [ ] Print workflow with animation
- [ ] QR code generation for guest downloads
- [ ] PWA offline support

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## License

ISC
