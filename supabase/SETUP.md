# Supabase Setup Instructions

## 1. Database Schema

Run the migration SQL in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of migrations/001_initial_schema.sql
```

Or use the Supabase CLI:
```bash
supabase db push
```

## 2. Storage Buckets

Create the following storage buckets in your Supabase dashboard:

### Frames Bucket
- **Name:** `frames`
- **Public:** Yes (public read access)
- **File size limit:** 10MB
- **Allowed MIME types:** `image/png`, `image/jpeg`, `image/jpg`

### Logos Bucket
- **Name:** `logos`
- **Public:** Yes (public read access)
- **File size limit:** 5MB
- **Allowed MIME types:** `image/png`, `image/jpeg`, `image/jpg`, `image/svg+xml`

### Photos Bucket
- **Name:** `photos`
- **Public:** No (private, admin access only)
- **File size limit:** 10MB
- **Allowed MIME types:** `image/png`, `image/jpeg`, `image/jpg`

### Composites Bucket
- **Name:** `composites`
- **Public:** Yes (public read access)
- **File size limit:** 10MB
- **Allowed MIME types:** `image/png`, `image/jpeg`, `image/jpg`

## 3. Storage Policies

### Frames Bucket Policies

**Select Policy (Public Read):**
```sql
CREATE POLICY "Public can view frames"
ON storage.objects FOR SELECT
USING (bucket_id = 'frames');
```

**Insert Policy (Authenticated Users):**
```sql
CREATE POLICY "Authenticated users can upload frames"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'frames' AND auth.role() = 'authenticated');
```

**Delete Policy (Authenticated Users):**
```sql
CREATE POLICY "Authenticated users can delete frames"
ON storage.objects FOR DELETE
USING (bucket_id = 'frames' AND auth.role() = 'authenticated');
```

### Logos Bucket Policies

**Select Policy (Public Read):**
```sql
CREATE POLICY "Public can view logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'logos');
```

**Insert Policy (Authenticated Users):**
```sql
CREATE POLICY "Authenticated users can upload logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');
```

**Delete Policy (Authenticated Users):**
```sql
CREATE POLICY "Authenticated users can delete logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'logos' AND auth.role() = 'authenticated');
```

### Photos Bucket Policies

**Select Policy (Authenticated Only):**
```sql
CREATE POLICY "Authenticated users can view photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'photos' AND auth.role() = 'authenticated');
```

**Insert Policy (Authenticated Users):**
```sql
CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'photos' AND auth.role() = 'authenticated');
```

### Composites Bucket Policies

**Select Policy (Public Read):**
```sql
CREATE POLICY "Public can view composites"
ON storage.objects FOR SELECT
USING (bucket_id = 'composites');
```

**Insert Policy (Authenticated Users):**
```sql
CREATE POLICY "Authenticated users can upload composites"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'composites' AND auth.role() = 'authenticated');
```

## 4. Environment Variables

Add these to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_PASSWORD=your-secure-admin-password
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 5. Test Database Connection

Run this in your terminal:
```bash
npm run dev
```

Then visit `/admin` to test the connection.
