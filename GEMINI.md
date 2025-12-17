# Photobooth App

## Project Overview
**Photobooth App** is a mobile-first web application designed for events (weddings, birthdays, corporate, etc.). It allows guests to take photos, apply decorative frames and stickers, add messages, and generate composite images for printing or downloading.

### Tech Stack
-   **Framework:** Next.js 16+ (App Router) with TypeScript
-   **Styling:** Tailwind CSS v4
-   **Animations:** Framer Motion
-   **Canvas/Compositing:** Konva.js with react-konva
-   **Database:** Supabase (PostgreSQL)
-   **Storage:** Supabase Storage
-   **Camera:** MediaDevices API

## Building and Running

### Prerequisites
-   Node.js 18+
-   npm or yarn
-   Supabase account

### Key Scripts
-   `npm run dev`: Start the development server (http://localhost:3000).
-   `npm run dev:network`: Start the development server accessible via LAN (useful for mobile testing).
-   `npm run build`: Build the application for production.
-   `npm run start`: Start the production server.
-   `npm run lint`: Run ESLint to check for code quality issues.

### Environment Setup
1.  Copy `.env.local.example` to `.env.local`.
2.  Fill in the required Supabase credentials (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) and `ADMIN_PASSWORD`.
3.  Ensure the Supabase database and storage buckets are set up according to `supabase/SETUP.md`.

## Key Files and Directories

-   **`app/`**: Contains the Next.js App Router pages and API routes.
    -   `page.tsx`: Landing page.
    -   `capture/page.tsx`: Main camera capture interface.
    -   `review/page.tsx`: Photo review and editing screen.
    -   `admin/`: Admin panel for managing events and assets.
    -   `api/`: Backend API routes (handling file uploads, auth, etc.).
-   **`components/`**: React components organized by feature (`capture`, `review`, `admin`, `ui`).
    -   `PhotoCompositor.tsx`: Handles the canvas generation of the final photo strip.
-   **`lib/`**: Utility functions and clients.
    -   `supabase.ts`: Supabase client initialization.
    -   `events.ts`: Event-related utility functions.
-   **`types/index.ts`**: TypeScript definitions for the project (Events, Sessions, Photos, etc.).
-   **`supabase/`**: Database setup files.
    -   `schema.sql`: Initial database schema.
    -   `SETUP.md`: Detailed instructions for Supabase configuration (tables, policies, buckets).

## Development Conventions

-   **Mobile-First Design:** The UI is optimized for mobile devices.
-   **State Management:** React Context (`SessionContext`) is used for managing the session state (captured photos, selected event, etc.).
-   **Database Access:** Supabase client is used for data fetching and mutations. RLS (Row Level Security) policies are crucial for security (defined in `supabase/SETUP.md` and schema files).
-   **Canvas Logic:** `react-konva` is used for image compositing. Complex canvas logic often resides in `PhotoCompositor.tsx`.
-   **Type Safety:** Strict TypeScript usage is encouraged. Define new types in `types/index.ts` and import them where needed.
