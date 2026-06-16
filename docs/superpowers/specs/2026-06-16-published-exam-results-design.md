# Published Belt-Test Results — Design

**Date:** 2026-06-16
**Status:** Approved

## Goal

Let an admin publish official belt-test result PDFs on the public site. Each
published result has its own page that displays the PDF inline (mobile-friendly)
and its own QR code. Scanning the QR opens that specific result so a student can
find their own name in the list. Many results can exist over time, and the admin
can manage them (upload, edit, delete, publish/unpublish).

## Scope decisions

- **PDF-as-is.** We display the uploaded PDF itself, nicely presented. We do
  **not** parse per-student rows or pass/fail. (The belt/kyu in the source PDF
  is encoded only as a cell color, which is not machine-readable text, and there
  is no pass/fail column — every listed student passed. So structured extraction
  was explicitly rejected in favor of showing the document as-is.)
- **Public.** Results are publicly viewable; no login required to open a result
  via its QR/link.
- **Metadata per result:** Title, Test date, Awarded date, Location. These are
  auto-pre-filled from the PDF's text header on upload, and editable before save.

This is distinct from the existing `resultController` (tournament fight results)
and `beltExamController` (belt grading). It is a new, separate feature.

## Data model (Prisma) — new model `ExamResult`

```prisma
model ExamResult {
  id          String    @id @default(uuid())
  title       String
  testDate    DateTime?
  awardedDate DateTime?
  location    String?
  pdfUrl      String
  isPublished Boolean   @default(true)

  createdBy   String
  creator     User      @relation("ExamResultCreator", fields: [createdBy], references: [id])

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([isPublished, createdAt])
}
```

Add the inverse relation field on `User` (`examResults ExamResult[] @relation("ExamResultCreator")`).
Create a migration.

## Backend

New `examResultRoutes.ts` + `examResultController.ts`, mounted in `app.ts` at
`/api/exam-results` (follow the existing router import/mount pattern).

| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| GET | `/api/exam-results` | public | list published, newest first |
| GET | `/api/exam-results/:id` | public | single result (QR page) |
| POST | `/api/exam-results` | ADMIN | create from `{ pdfUrl, title, testDate?, awardedDate?, location?, isPublished? }` |
| PATCH | `/api/exam-results/:id` | ADMIN | edit metadata / publish toggle |
| DELETE | `/api/exam-results/:id` | ADMIN | delete |

- Auth via existing `protect` + `restrictTo('ADMIN')` middleware (mirror
  `resultRoutes.ts`). Public GETs registered before `router.use(protect)`.
- `GET /` returns only `isPublished: true`; admin list can pass a flag or use a
  separate query — simplest: admin management screen calls the same list but the
  controller returns all rows when the requester is an authenticated admin
  (otherwise published only). Implement by checking `req.user?.role === 'ADMIN'`.

### Upload pipeline

- Reuse the existing `/api/upload` endpoint with `?folder=results`. It already
  accepts `application/pdf` and stores to Supabase (local fallback) returning a
  URL. The management UI uploads the file first, then POSTs the returned `pdfUrl`
  with the metadata.
- **Bump multer file-size limit** in `uploadController.ts` from 5 MB to 15 MB
  (result PDFs can be image-heavy; sample is 671 KB).

### Auto-fill (pdf-parse)

- Add `pdf-parse` (backend dep). Provide a helper, e.g.
  `POST /api/exam-results/parse` (ADMIN) that accepts a `pdfUrl` (or runs as part
  of upload), reads the text layer, and best-effort extracts:
  - Title — derive from the "RESULT BELT TEST" / "AT- ..." lines.
  - testDate — from "DATE OF TEST 14. 06 .2026".
  - awardedDate — from "AWARDED DATE- 16.06.2026".
  - location — the "AT- ..." line (e.g. "MAS OYAMA KARATE ACADEMY, KHURSIPAR, DURG CHHATTISGARH").
- Parsing is best-effort: on any failure return empty fields; the admin types
  them manually. Never block upload on parse failure.

## Frontend — public

- **`/results`** (`frontend/src/app/results/page.tsx`): grid/list of published
  results (title, test date, location), newest first. Cards link to the detail
  page. Match the site's existing dark aesthetic.
- **`/results/[id]`** (`frontend/src/app/results/[id]/page.tsx`): header with
  title / test date / awarded date / location, the **PDF rendered inline** via
  `react-pdf` (pdf.js), and a **Download PDF** button. This is the QR target page.
  Handle multi-page PDFs (the sample has 2 pages) and a loading state.

### react-pdf

- Add `react-pdf` (frontend dep). Configure the pdf.js worker (e.g. via
  `pdfjs.GarbageCollector`/`workerSrc` pointing at the bundled worker) so it works
  in Next.js 16 App Router. Render the viewer in a client component. Ensure
  responsive width so it reads well on phones (QR scans open on mobile).

## Frontend — management (inside existing `AdminDashboard`)

- Add a **"Results"** section to `AdminDashboard` following the existing
  section/tab pattern.
- Table of all results (incl. unpublished) with: Upload button, title, test date,
  published toggle, edit, delete.
- **Upload flow:** pick PDF → upload to `/api/upload?folder=results` → optional
  auto-fill parse → editable form (title/dates/location/published) → POST create.
- **Per row QR:** generate client-side with `qrcode.react` encoding
  `${siteOrigin}/results/${id}`. Provide **Download QR (PNG)** and **Copy link**.
  Use `window.location.origin` on the client for the base URL.

## Dependencies to add

- Frontend: `react-pdf` (inline viewer). `qrcode` / `qrcode.react` already present.
- Backend: `pdf-parse` (header auto-fill).

## Error handling

- Upload: surface multer/file-type errors to the admin; reject non-PDF.
- Detail page: if result not found or unpublished (and viewer not admin) → 404 /
  friendly "result not found" state.
- PDF render: show a fallback "Download PDF" link if `react-pdf` fails to render.
- Auto-fill: silent best-effort; never blocks the create flow.

## Testing

- Backend: controller tests for list (published-only vs admin-all), create,
  patch, delete, and access control (non-admin blocked from write routes).
- Auto-fill: unit test the header parser against the sample PDF text.
- Frontend: render test for the results list and the detail page (mock api),
  and QR value/link generation.

## Out of scope (YAGNI)

- Per-student structured data / searchable pass-fail rows.
- OCR / cell-color detection for belt level.
- Student accounts linking to their own results.
