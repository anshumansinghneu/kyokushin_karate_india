# Album/Collection System for Gallery

**Date:** 2026-04-06
**Status:** Approved

## Overview

Add an Album system to the gallery so photos from camps, seminars, tournaments, and other events can be organized into browsable collections. Albums become the primary gallery experience — the gallery page shows album covers in a hero+grid layout, and users click into albums to view photos.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Who creates albums | Admin only | Keeps organization consistent and controlled |
| Photo-to-album linking | At upload time + admin reorganizes later | Flexible — uploaders pick album optionally, admin can move photos anytime |
| Photo-album cardinality | Many-to-many | A photo can belong to multiple albums (e.g., "Summer Camp" and "Best of 2026") |
| Album types | Typed + auto-create from events | Predefined types (Camp, Seminar, Tournament, etc.) with auto-creation when events are created |
| Gallery page layout | Stacked photo previews grid | Albums shown as stacked photo piles — visual, feels like physical photo albums |

## Data Model

### New: `Album` model

```prisma
model Album {
  id            String        @id @default(uuid())
  name          String
  description   String?
  coverImageUrl String?
  type          AlbumType     @default(GENERAL)
  isPinned      Boolean       @default(false)
  date          DateTime?
  eventId       String?       @unique
  event         Event?        @relation(fields: [eventId], references: [id], onDelete: SetNull)
  createdBy     String
  creator       User          @relation("AlbumCreator", fields: [createdBy], references: [id])
  photos        AlbumPhoto[]
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
}

enum AlbumType {
  CAMP
  SEMINAR
  TOURNAMENT
  BELT_EXAM
  TRAINING
  GENERAL
}
```

### New: `AlbumPhoto` join table

```prisma
model AlbumPhoto {
  id        String   @id @default(uuid())
  albumId   String
  album     Album    @relation(fields: [albumId], references: [id], onDelete: Cascade)
  galleryId String
  gallery   Gallery  @relation(fields: [galleryId], references: [id], onDelete: Cascade)
  order     Int      @default(0)
  addedAt   DateTime @default(now())

  @@unique([albumId, galleryId])
}
```

### Modified: `Gallery` model

Add relation field only — no schema-breaking changes:

```prisma
// Add to existing Gallery model:
albums AlbumPhoto[]
```

### Modified: `User` model

```prisma
// Add to existing User model:
createdAlbums Album[] @relation("AlbumCreator")
```

### Modified: `Event` model

```prisma
// Add to existing Event model:
album Album?
```

## Auto-Creation Logic

When an Event is created (via `POST /api/events`):

1. Create an Album with:
   - `name` = event name
   - `type` = mapped from EventType (TOURNAMENT->TOURNAMENT, CAMP->CAMP, SEMINAR->SEMINAR, BELT_EXAM->BELT_EXAM)
   - `eventId` = new event ID
   - `createdBy` = admin who created the event
   - `date` = event start date
2. Admin can later edit album name, description, cover image
3. If event is deleted, album persists but `eventId` is set to null (OnDelete: SetNull)

## API Endpoints

### Album CRUD

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/albums` | Public | List albums, filterable by `type`, paginated, sorted by date desc |
| GET | `/api/albums/:id` | Public | Album detail with paginated photos |
| POST | `/api/albums` | Admin | Create album |
| PATCH | `/api/albums/:id` | Admin | Update album (name, description, cover, type, isPinned, date) |
| DELETE | `/api/albums/:id` | Admin | Delete album, keeps all photos in gallery |

### Album-Photo Management

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/albums/:id/photos` | Admin | Add photos to album. Body: `{ galleryIds: string[] }` |
| DELETE | `/api/albums/:id/photos/:photoId` | Admin | Remove photo from album (unlink only) |
| PATCH | `/api/albums/:id/photos/reorder` | Admin | Update photo order. Body: `{ orders: [{galleryId, order}] }` |

### Modified Existing Endpoints

- `POST /api/gallery` — add optional `albumId` field. If provided, creates AlbumPhoto link after gallery item creation.
- `GET /api/gallery` — add optional `albumId` query param to filter photos by album.
- Event creation (`POST /api/events`) — trigger auto-album creation after event is saved.

No breaking changes to existing endpoints.

## Frontend Pages

### Gallery Page (`/gallery`) — Redesigned

1. **Type Filter Bar** — horizontal pills: All | Camps | Seminars | Tournaments | Grading | General
2. **Stacked Album Grid** — responsive grid (3 cols desktop, 2 tablet, 1 mobile). Each album rendered as stacked photo pile effect (layered cards with slight rotation), album name, photo count below
3. **"All Photos" Link** — at bottom, navigates to flat gallery view for unalbummed/general browsing
4. **Search** — search albums by name

### Album Detail Page (`/gallery/albums/[id]`) — New

1. **Album Header** — cover image as banner, name, description, date, type badge, photo count
2. **Masonry Photo Grid** — reuses existing masonry layout, lazy loading, shimmer placeholders
3. **Lightbox** — reuses existing lightbox (zoom, swipe, download, share, info)
4. **Upload Button** — for authenticated users, pre-selects this album
5. **Breadcrumb** — "Gallery > Album Name" at top

### Upload Flow Changes

- Existing upload modal gains an optional "Album" dropdown populated from albums list
- When uploading from inside an album detail page, album is pre-selected
- Photos can still be uploaded without an album (goes to general pool)

### Admin Dashboard — New "Albums" Section

- **Album list** — table of all albums with name, type, photo count, date, pinned status
- **Create/Edit album** — form: name, type dropdown, description, cover image upload, date, optional event link
- **Manage photos** — inside an album:
  - View all album photos
  - Remove photos (unlink, not delete)
  - Add existing gallery photos via search/browse picker
  - Reorder photos
- **Pin album** — toggle which album appears as the hero banner. Only one album can be pinned at a time; pinning a new one unpins the previous. If none is pinned, the most recent album by date is used.
- **Delete album** — removes album, keeps all photos

### Admin Dashboard — Pending Photos Panel (new addition)

- View student-uploaded photos awaiting approval
- Approve individually or bulk approve
- Optionally assign to an album during approval

## Migration Notes

- Existing gallery photos remain untouched — they simply have no album associations
- Existing event-linked photos (`Gallery.eventId`) are not auto-migrated into albums. Admin can manually organize them, or a one-time migration script can be provided.
- The `Gallery.eventId` and `Gallery.dojoId` fields remain for backward compatibility
