# Creative Archive

A visual-first gallery showcasing creative work without case studies, titles, or descriptions. Visitors browse like opening a sketchbook where visuals speak for themselves.

## Database Schema

```sql
create table creative_archive (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  media_url text not null,
  media_type text not null check (media_type in ('image', 'video')),
  sort_order integer not null default 0
);
```

The schema is intentionally minimal:
- `id` - UUID primary key
- `created_at` / `updated_at` - Timestamps
- `media_url` - Public URL from Supabase Storage
- `media_type` - Either "image" or "video"
- `sort_order` - For manual reordering

No titles, captions, categories, tags, or publish state — the visuals are the content.

## Storage Bucket

**Bucket name:** `archive-media`

**Supported formats:**
- Images: `jpg`, `jpeg`, `png`, `webp`, `gif`
- Videos: `mp4`, `webm`

The bucket is configured as public with policies allowing:
- Public read access
- Authenticated admin insert, update, delete

## Upload Flow

1. User selects multiple files via file input (`accept="image/*,video/*"`)
2. Each file is uploaded to `/api/admin/upload?bucket=archive-media`
3. The returned public URL is stored as a new `creative_archive` record
4. Media type is detected from file MIME type
5. Items appear immediately in the masonry gallery

## API Routes

### `/api/admin/creative-archive`
- `GET` - Returns cached items (actual fetch in `lib/content.ts`)
- `POST` - Creates placeholder (used for API pattern consistency)

### `/api/admin/creative-archive/[id]`
- `DELETE` - Removes item and deletes from storage

### `/api/admin/creative-archive/reorder`
- `PATCH` - Updates `sort_order` for all provided IDs

## Component Structure

```
src/components/
├── archive/
│   ├── archive-page-shell.tsx  # Main client component with admin mode
│   └── archive-card.tsx        # "Explore Archive →" card for home page
└── shared/
    ├── media-masonry.tsx       # Reusable masonry gallery
    └── media-lightbox.tsx      # Reusable fullscreen viewer
```

### MediaMasonry

Renders media items in a CSS columns masonry layout:
- Public mode: Click to open lightbox
- Admin mode: Drag-drop reorder, delete button

### MediaLightbox

Fullscreen portal-based viewer:
- Image or video rendering based on URL extension
- Keyboard navigation (Escape, ArrowLeft, ArrowRight)
- Auto-advance on video end
- Mobile swipe support via touch events

## Architecture Decisions

### Why extracted shared components?

The masonry and lightbox patterns are identical between Pets and Creative Archive. Extracting them avoids duplication and ensures consistent behavior across the portfolio.

### Why no child table?

Pets uses a `pet_images` child table because each image needs captions and "featured on home" status. Creative Archive has no metadata — each record is a direct reference to media storage.

### Why CSS columns instead of a library?

CSS columns provide natural masonry behavior without JavaScript calculations. The `break-inside-avoid` class prevents awkward breaks mid-item.

### Why videos in lightbox only?

Videos in the masonry grid would autoplay and consume bandwidth. The lightbox loads videos on-demand and handles playback controls.

## Admin Experience

The admin interface mirrors Google Photos:
1. Upload button opens file picker
2. Multiple files upload sequentially
3. Drag items to reorder
4. Click "Remove" to delete
5. Autosave triggers 700ms after changes
6. No forms, no metadata editing