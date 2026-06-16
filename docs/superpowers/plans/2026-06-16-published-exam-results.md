# Published Belt-Test Results Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an admin upload official belt-test result PDFs that appear on a public page, each rendered inline (mobile-friendly) with its own shareable QR code.

**Architecture:** A new `ExamResult` Prisma model stores PDF URL + metadata only (no per-student parsing). A new Express resource (`/api/exam-results`) exposes public reads and admin writes, reusing the existing `/api/upload` pipeline for the file. The Next.js frontend adds a public `/results` list, a `/results/[id]` detail page that renders the PDF with `react-pdf`, and a "Results" section in the existing `AdminDashboard` with QR generation via the already-installed `qrcode.react`.

**Tech Stack:** Prisma + PostgreSQL, Express 5 (TypeScript), Next.js 16 App Router (React 19), Tailwind, `react-pdf` (new), `pdf-parse` (new), `qrcode.react` (existing).

**Testing note:** The backend has **no test runner** (`npm test` is a stub) and uses ad-hoc `check_*.ts` scripts + manual API checks. This plan follows that convention: backend pure functions get a runnable `ts-node` verification script; controllers get documented `curl` checks. The frontend uses the existing **vitest** runner for real unit tests.

---

## File structure

**Backend**
- Modify `backend/prisma/schema.prisma` — add `ExamResult` model + `User.examResults` inverse relation.
- Create `backend/src/utils/parseResultPdf.ts` — pure header-text parser.
- Create `backend/src/utils/parseResultPdf.check.ts` — runnable verification script.
- Create `backend/src/controllers/examResultController.ts` — CRUD + parse endpoint.
- Create `backend/src/routes/examResultRoutes.ts` — route wiring.
- Modify `backend/src/app.ts` — import + mount router.
- Modify `backend/src/controllers/uploadController.ts` — bump file-size limit to 15 MB.

**Frontend**
- Create `frontend/src/lib/resultLinks.ts` — build public result URL (+ vitest test).
- Create `frontend/src/lib/resultLinks.test.ts` — unit test.
- Create `frontend/src/app/results/page.tsx` — public list.
- Create `frontend/src/components/results/ResultPdfViewer.tsx` — react-pdf viewer (client).
- Create `frontend/src/app/results/[id]/page.tsx` — public detail page.
- Create `frontend/src/components/dashboard/ResultsManager.tsx` — admin management UI.
- Modify `frontend/src/components/dashboard/AdminDashboard.tsx` — register the "Results" tab.

---

## Task 1: Prisma model + migration

**Files:**
- Modify: `backend/prisma/schema.prisma`

- [ ] **Step 1: Add the `ExamResult` model**

Append to `backend/prisma/schema.prisma`:

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

- [ ] **Step 2: Add the inverse relation on `User`**

In the `User` model (around `backend/prisma/schema.prisma:117`, alongside its other relation fields), add:

```prisma
  examResults           ExamResult[]     @relation("ExamResultCreator")
```

- [ ] **Step 3: Create and apply the migration**

Run (from `backend/`):

```bash
npx prisma migrate dev --name add_exam_result
```

Expected: a new folder under `backend/prisma/migrations/`, "Your database is now in sync", and Prisma Client regenerated. If the DB is unreachable locally, use `npx prisma migrate dev --create-only --name add_exam_result` then apply later — but generate the client either way with `npx prisma generate`.

- [ ] **Step 4: Verify the client type exists**

Run (from `backend/`):

```bash
node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();console.log(typeof p.examResult.findMany)"
```

Expected output: `function`

- [ ] **Step 5: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations
git commit -m "feat(results): add ExamResult model and migration"
```

---

## Task 2: PDF header parser (pure function)

The official PDF's text layer contains the header data. This pure function extracts best-effort metadata from that text. It must never throw — missing fields return `undefined`.

**Files:**
- Create: `backend/src/utils/parseResultPdf.ts`
- Create (verification): `backend/src/utils/parseResultPdf.check.ts`

- [ ] **Step 1: Write the verification script first (this is our "test")**

Create `backend/src/utils/parseResultPdf.check.ts`:

```typescript
import { parseResultHeader } from './parseResultPdf';

// Header text as extracted from the sample PDF's text layer.
const SAMPLE = `REG NO-828/2013
Registered by
MINISTRY OF YOUTH AFFAIRS AND SPORTS, NITI AAYOG,FIT INDIA,
Mo-9956745114
Ref No- DateDATE OF TEST 14. 06 .2026 AWARDED DATE- 16.06.2026
RESULT BELT TEST
AT- MAS OYAMA KARATE ACADEMY, KHURSIPAR
DURG CHHATTIGHAR
S.
N
NAME AGE CERTIFICAE`;

const r = parseResultHeader(SAMPLE);

function assert(cond: boolean, msg: string) {
  if (!cond) { console.error('FAIL:', msg, '=>', JSON.stringify(r)); process.exit(1); }
}

assert(!!r.testDate && r.testDate.getUTCFullYear() === 2026 && r.testDate.getUTCMonth() === 5 && r.testDate.getUTCDate() === 14, 'testDate should be 2026-06-14');
assert(!!r.awardedDate && r.awardedDate.getUTCFullYear() === 2026 && r.awardedDate.getUTCMonth() === 5 && r.awardedDate.getUTCDate() === 16, 'awardedDate should be 2026-06-16');
assert(!!r.location && /MAS OYAMA KARATE ACADEMY/i.test(r.location), 'location should contain venue');
assert(!!r.title && /Belt Test/i.test(r.title), 'title should mention Belt Test');

// Empty input must not throw and returns all-undefined.
const empty = parseResultHeader('');
assert(empty.title === undefined && empty.testDate === undefined, 'empty input yields undefined fields');

console.log('OK', JSON.stringify({ ...r, testDate: r.testDate?.toISOString(), awardedDate: r.awardedDate?.toISOString() }));
```

- [ ] **Step 2: Run it to verify it fails (module not found)**

Run (from `backend/`):

```bash
npx ts-node src/utils/parseResultPdf.check.ts
```

Expected: FAIL — cannot find module `./parseResultPdf`.

- [ ] **Step 3: Implement the parser**

Create `backend/src/utils/parseResultPdf.ts`:

```typescript
export interface ParsedResultHeader {
  title?: string;
  testDate?: Date;
  awardedDate?: Date;
  location?: string;
}

// Parse a "DD. MM .YYYY" or "DD.MM.YYYY" style date (spaces optional) into a UTC Date.
function parseDmy(raw: string): Date | undefined {
  const m = raw.match(/(\d{1,2})\s*\.\s*(\d{1,2})\s*\.\s*(\d{4})/);
  if (!m) return undefined;
  const day = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  const year = parseInt(m[3], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined;
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Best-effort extraction of header metadata from the PDF's text layer.
 * Never throws; absent fields are left undefined.
 */
export function parseResultHeader(text: string): ParsedResultHeader {
  const out: ParsedResultHeader = {};
  if (!text) return out;

  const flat = text.replace(/\s+/g, ' ');

  // DATE OF TEST 14. 06 .2026
  const testMatch = flat.match(/DATE OF TEST\s*([\d.\s]+\d{4})/i);
  if (testMatch) out.testDate = parseDmy(testMatch[1]);

  // AWARDED DATE- 16.06.2026
  const awardMatch = flat.match(/AWARDED DATE-?\s*([\d.\s]+\d{4})/i);
  if (awardMatch) out.awardedDate = parseDmy(awardMatch[1]);

  // AT- <venue>  (stop at the column-header row that starts with "S." / "NAME")
  const atMatch = flat.match(/AT-\s*(.+?)(?:\s+S\.\s*N\b|\s+NAME\b|$)/i);
  if (atMatch) {
    out.location = atMatch[1].replace(/\s+/g, ' ').trim();
  }

  // Title: prefer a venue-based title, else fall back to "Belt Test Result".
  if (out.location) {
    out.title = `Belt Test — ${out.location}`;
  } else if (/RESULT BELT TEST/i.test(flat)) {
    out.title = 'Belt Test Result';
  }

  return out;
}
```

- [ ] **Step 4: Run the verification script to confirm it passes**

Run (from `backend/`):

```bash
npx ts-node src/utils/parseResultPdf.check.ts
```

Expected: prints `OK {...}` with `testDate` `2026-06-14...`, `awardedDate` `2026-06-16...`, a `location` containing the venue, and a `title`.

- [ ] **Step 5: Commit**

```bash
git add backend/src/utils/parseResultPdf.ts backend/src/utils/parseResultPdf.check.ts
git commit -m "feat(results): add best-effort PDF header parser"
```

---

## Task 3: Bump upload size limit

Result PDFs can be image-heavy. The current limit is 5 MB.

**Files:**
- Modify: `backend/src/controllers/uploadController.ts`

- [ ] **Step 1: Change the multer limit**

In `backend/src/controllers/uploadController.ts`, find:

```typescript
    limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
```

Replace with:

```typescript
    limits: { fileSize: 15 * 1024 * 1024 } // 15 MB (result PDFs can be image-heavy)
```

- [ ] **Step 2: Verify it compiles**

Run (from `backend/`):

```bash
npx tsc --noEmit
```

Expected: no errors related to `uploadController.ts`.

- [ ] **Step 3: Commit**

```bash
git add backend/src/controllers/uploadController.ts
git commit -m "chore(upload): raise file size limit to 15MB"
```

---

## Task 4: Backend controller + routes

`pdf-parse` has a known quirk: importing the package index runs debug code that reads a test file. Always import the lib entry: `require('pdf-parse/lib/pdf-parse.js')`.

**Files:**
- Create: `backend/src/controllers/examResultController.ts`
- Create: `backend/src/routes/examResultRoutes.ts`
- Modify: `backend/src/app.ts`

- [ ] **Step 1: Install `pdf-parse`**

Run (from `backend/`):

```bash
npm install pdf-parse && npm install -D @types/pdf-parse
```

Expected: both packages added to `backend/package.json`.

- [ ] **Step 2: Write the controller**

Create `backend/src/controllers/examResultController.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import prisma from '../prisma';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/errorHandler';
import { parseResultHeader } from '../utils/parseResultPdf';

// pdf-parse: import the lib entry to avoid its debug-mode test-file read.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse/lib/pdf-parse.js');

const LOCAL_UPLOADS_DIR = path.join(__dirname, '../uploads');

// GET /api/exam-results — public lists published; admins (if authenticated) see all.
export const getExamResults = catchAsync(async (req: Request, res: Response) => {
  const isAdmin = (req as any).user?.role === 'ADMIN';
  const where = isAdmin ? {} : { isPublished: true };

  const results = await prisma.examResult.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { creator: { select: { id: true, name: true } } },
  });

  res.status(200).json({ status: 'success', data: { results } });
});

// GET /api/exam-results/:id — public detail (published only unless admin).
export const getExamResult = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const isAdmin = (req as any).user?.role === 'ADMIN';
  const result = await prisma.examResult.findUnique({
    where: { id: req.params.id },
    include: { creator: { select: { id: true, name: true } } },
  });

  if (!result || (!result.isPublished && !isAdmin)) {
    return next(new AppError('Result not found', 404));
  }

  res.status(200).json({ status: 'success', data: { result } });
});

// POST /api/exam-results — ADMIN: create from an already-uploaded pdfUrl + metadata.
export const createExamResult = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { title, pdfUrl, testDate, awardedDate, location, isPublished } = req.body;

  if (!title || !pdfUrl) {
    return next(new AppError('title and pdfUrl are required', 400));
  }

  const result = await prisma.examResult.create({
    data: {
      title,
      pdfUrl,
      testDate: testDate ? new Date(testDate) : null,
      awardedDate: awardedDate ? new Date(awardedDate) : null,
      location: location || null,
      isPublished: isPublished === undefined ? true : !!isPublished,
      createdBy: (req as any).user.id,
    },
  });

  res.status(201).json({ status: 'success', data: { result } });
});

// PATCH /api/exam-results/:id — ADMIN: update metadata / publish toggle.
export const updateExamResult = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { title, pdfUrl, testDate, awardedDate, location, isPublished } = req.body;

  const data: any = {};
  if (title !== undefined) data.title = title;
  if (pdfUrl !== undefined) data.pdfUrl = pdfUrl;
  if (testDate !== undefined) data.testDate = testDate ? new Date(testDate) : null;
  if (awardedDate !== undefined) data.awardedDate = awardedDate ? new Date(awardedDate) : null;
  if (location !== undefined) data.location = location || null;
  if (isPublished !== undefined) data.isPublished = !!isPublished;

  const result = await prisma.examResult.update({
    where: { id: req.params.id },
    data,
  }).catch(() => null);

  if (!result) return next(new AppError('Result not found', 404));

  res.status(200).json({ status: 'success', data: { result } });
});

// DELETE /api/exam-results/:id — ADMIN.
export const deleteExamResult = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const deleted = await prisma.examResult.delete({
    where: { id: req.params.id },
  }).catch(() => null);

  if (!deleted) return next(new AppError('Result not found', 404));

  res.status(204).json({ status: 'success', data: null });
});

// Resolve PDF bytes from either a local /uploads path or an http(s) URL.
async function loadPdfBytes(pdfUrl: string): Promise<Buffer | null> {
  try {
    if (pdfUrl.startsWith('/uploads/')) {
      const rel = pdfUrl.replace('/uploads/', '');
      const full = path.join(LOCAL_UPLOADS_DIR, rel);
      if (!fs.existsSync(full)) return null;
      return fs.readFileSync(full);
    }
    if (pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://')) {
      const resp = await fetch(pdfUrl);
      if (!resp.ok) return null;
      return Buffer.from(await resp.arrayBuffer());
    }
    return null;
  } catch {
    return null;
  }
}

// POST /api/exam-results/parse — ADMIN: best-effort metadata suggestions from a pdfUrl.
// Never fails the request; on any problem returns empty suggestions.
export const parseExamResult = catchAsync(async (req: Request, res: Response) => {
  const { pdfUrl } = req.body;
  let suggestions = {};

  if (pdfUrl) {
    const bytes = await loadPdfBytes(pdfUrl);
    if (bytes) {
      try {
        const data = await pdfParse(bytes);
        suggestions = parseResultHeader(data.text || '');
      } catch {
        suggestions = {};
      }
    }
  }

  res.status(200).json({ status: 'success', data: { suggestions } });
});
```

- [ ] **Step 3: Write the routes**

Create `backend/src/routes/examResultRoutes.ts`:

```typescript
import express from 'express';
import {
  getExamResults,
  getExamResult,
  createExamResult,
  updateExamResult,
  deleteExamResult,
  parseExamResult,
} from '../controllers/examResultController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

// Public reads (controller hides unpublished from non-admins).
router.get('/', getExamResults);
router.get('/:id', getExamResult);

// Admin writes.
router.use(protect);
router.post('/parse', restrictTo('ADMIN'), parseExamResult);
router.post('/', restrictTo('ADMIN'), createExamResult);
router.patch('/:id', restrictTo('ADMIN'), updateExamResult);
router.delete('/:id', restrictTo('ADMIN'), deleteExamResult);

export default router;
```

> Note: the public `GET /` and `GET /:id` do not run `protect`, so `req.user` is undefined for anonymous viewers — the controller's `(req as any).user?.role` check handles that. The admin management UI will read all results through a separately authenticated call (Task 8 uses the admin's token, which `protect` is not applied to here — so admins must rely on `isPublished` filter being bypassed only when a token is present; to make admin-all work, the management list calls `GET /` **with** the auth header, and we add an optional auth pass-through). See Step 4.

- [ ] **Step 4: Add an optional-auth pass-through for the public list**

So that an authenticated admin hitting `GET /` sees unpublished rows, attach a non-blocking auth check. In `backend/src/routes/examResultRoutes.ts`, replace the two public read lines with:

```typescript
import { protect, restrictTo, attachUserIfPresent } from '../middleware/authMiddleware';
```

```typescript
// Public reads with optional auth (admins see unpublished too).
router.get('/', attachUserIfPresent, getExamResults);
router.get('/:id', attachUserIfPresent, getExamResult);
```

Then add `attachUserIfPresent` to `backend/src/middleware/authMiddleware.ts`. That file already imports `jwt` (`import jwt from 'jsonwebtoken'`) and `prisma` (`import prisma from '../prisma'`) at the top — reuse them. After the existing `protect` export, add:

```typescript
// Like `protect`, but never blocks: attaches req.user if a valid token is present, else continues.
export const attachUserIfPresent = async (req: any, _res: any, next: any) => {
  try {
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer')) token = authHeader.split(' ')[1];
    if (!token) return next();

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (user) req.user = user;
  } catch {
    // ignore — anonymous request, leave req.user undefined
  }
  return next();
};
```

- [ ] **Step 5: Mount the router in `app.ts`**

In `backend/src/app.ts`, after the other route imports (near line 32) add:

```typescript
import examResultRouter from './routes/examResultRoutes';
```

And in the route-mount section (after line 128, alongside the other `app.use('/api/...')` lines) add:

```typescript
app.use('/api/exam-results', examResultRouter);
```

- [ ] **Step 6: Verify it compiles**

Run (from `backend/`):

```bash
npx tsc --noEmit
```

Expected: no new type errors.

- [ ] **Step 7: Manual API verification**

Start the backend (`npm run dev` from `backend/`) in one terminal. In another, run:

```bash
# Public list (should be 200 with a results array, even when empty)
curl -s localhost:8000/api/exam-results | head -c 300
# Create without auth (should be 401)
curl -s -o /dev/null -w "%{http_code}\n" -X POST localhost:8000/api/exam-results -H 'Content-Type: application/json' -d '{"title":"x","pdfUrl":"y"}'
```

Expected: first prints `{"status":"success","data":{"results":[...]}}`; second prints `401`.

- [ ] **Step 8: Commit**

```bash
git add backend/src/controllers/examResultController.ts backend/src/routes/examResultRoutes.ts backend/src/middleware/authMiddleware.ts backend/src/app.ts
git commit -m "feat(results): exam-results API (CRUD + parse + optional auth)"
```

---

## Task 5: Frontend result-link helper (+ vitest test)

QR codes and "copy link" must point at the live site origin so printed QRs work in any deployment.

**Files:**
- Create: `frontend/src/lib/resultLinks.ts`
- Create: `frontend/src/lib/resultLinks.test.ts`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/lib/resultLinks.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { buildResultUrl } from './resultLinks';

describe('buildResultUrl', () => {
  it('joins origin and result id', () => {
    expect(buildResultUrl('https://example.com', 'abc-123')).toBe('https://example.com/results/abc-123');
  });

  it('strips a trailing slash from origin', () => {
    expect(buildResultUrl('https://example.com/', 'abc')).toBe('https://example.com/results/abc');
  });

  it('returns empty string when origin is missing', () => {
    expect(buildResultUrl('', 'abc')).toBe('');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run (from `frontend/`):

```bash
npx vitest run src/lib/resultLinks.test.ts
```

Expected: FAIL — cannot resolve `./resultLinks`.

- [ ] **Step 3: Implement the helper**

Create `frontend/src/lib/resultLinks.ts`:

```typescript
/** Build the public URL for a result page from a site origin and result id. */
export function buildResultUrl(origin: string, id: string): string {
  if (!origin) return '';
  return `${origin.replace(/\/$/, '')}/results/${id}`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run (from `frontend/`):

```bash
npx vitest run src/lib/resultLinks.test.ts
```

Expected: 3 passing tests.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/resultLinks.ts frontend/src/lib/resultLinks.test.ts
git commit -m "feat(results): add buildResultUrl helper with tests"
```

---

## Task 6: Public results list page

**Files:**
- Create: `frontend/src/app/results/page.tsx`

- [ ] **Step 1: Write the page**

Create `frontend/src/app/results/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Calendar, MapPin, Loader2 } from "lucide-react";
import api from "@/lib/api";

interface ExamResult {
  id: string;
  title: string;
  testDate: string | null;
  awardedDate: string | null;
  location: string | null;
  createdAt: string;
}

function formatDate(d: string | null): string | null {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ResultsPage() {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/exam-results")
      .then((res) => setResults(res.data.data.results))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-[#080808] text-white px-4 py-16 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10">
          <h1 className="text-3xl font-bold sm:text-4xl">Belt Test Results</h1>
          <p className="mt-2 text-sm text-gray-400">Official published results. Open one to view the full list.</p>
        </header>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-red-500" /></div>
        ) : results.length === 0 ? (
          <p className="py-20 text-center text-gray-500">No results published yet.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {results.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/results/${r.id}`}
                  className="group flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 transition hover:border-red-500/40 hover:bg-white/[0.04]"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-red-900/30 p-2.5"><FileText className="h-5 w-5 text-red-400" /></div>
                    <h2 className="flex-1 text-lg font-semibold leading-snug group-hover:text-red-300">{r.title}</h2>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                    {formatDate(r.testDate) && (
                      <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(r.testDate)}</span>
                    )}
                    {r.location && (
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{r.location}</span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify it builds/renders**

Run (from `frontend/`):

```bash
npx tsc --noEmit
```

Expected: no type errors in `results/page.tsx`. (Optional manual check: with the dev server running, visit `http://localhost:3000/results` — empty-state or list shows.)

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/results/page.tsx
git commit -m "feat(results): public results list page"
```

---

## Task 7: PDF viewer + public detail page

`react-pdf` must run client-side only (it touches browser APIs). We render it in a `"use client"` component and load it from the page with `next/dynamic({ ssr: false })`.

**Files:**
- Create: `frontend/src/components/results/ResultPdfViewer.tsx`
- Create: `frontend/src/app/results/[id]/page.tsx`

- [ ] **Step 1: Install `react-pdf`**

Run (from `frontend/`):

```bash
npm install react-pdf
```

Expected: `react-pdf` added to `frontend/package.json` (v9.x).

- [ ] **Step 2: Write the viewer component**

Create `frontend/src/components/results/ResultPdfViewer.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Loader2, Download } from "lucide-react";

// Worker matched to the installed pdfjs version, served from CDN.
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function ResultPdfViewer({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState(0);
  const [width, setWidth] = useState(800);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setWidth(Math.min(900, containerRef.current.clientWidth));
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (failed) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center">
        <p className="text-sm text-gray-400">Couldn’t render the PDF in your browser.</p>
        <a href={url} target="_blank" rel="noopener noreferrer"
           className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500">
          <Download className="h-4 w-4" /> Download PDF
        </a>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full">
      <Document
        file={url}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        onLoadError={() => setFailed(true)}
        loading={<div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-red-500" /></div>}
      >
        {Array.from({ length: numPages }, (_, i) => (
          <div key={i} className="mb-4 overflow-hidden rounded-lg border border-white/10 bg-white">
            <Page pageNumber={i + 1} width={width} renderTextLayer renderAnnotationLayer />
          </div>
        ))}
      </Document>
    </div>
  );
}
```

- [ ] **Step 3: Write the detail page**

Create `frontend/src/app/results/[id]/page.tsx`:

```tsx
"use client";

import { use, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Calendar, MapPin, Award, Download, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { getImageUrl } from "@/lib/imageUtils";

const ResultPdfViewer = dynamic(() => import("@/components/results/ResultPdfViewer"), {
  ssr: false,
  loading: () => <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-red-500" /></div>,
});

interface ExamResult {
  id: string;
  title: string;
  testDate: string | null;
  awardedDate: string | null;
  location: string | null;
  pdfUrl: string;
}

function fmt(d: string | null): string | null {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ResultDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get(`/exam-results/${id}`)
      .then((res) => setResult(res.data.data.result))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-[#080808]"><Loader2 className="h-7 w-7 animate-spin text-red-500" /></main>;
  }

  if (notFound || !result) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#080808] text-white">
        <p className="text-gray-400">Result not found.</p>
        <Link href="/results" className="text-sm text-red-400 hover:underline">← Back to results</Link>
      </main>
    );
  }

  const pdfHref = getImageUrl(result.pdfUrl) || result.pdfUrl;

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/results" className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> All results
        </Link>

        <h1 className="text-2xl font-bold sm:text-3xl">{result.title}</h1>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-400">
          {fmt(result.testDate) && <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" />Test: {fmt(result.testDate)}</span>}
          {fmt(result.awardedDate) && <span className="inline-flex items-center gap-1.5"><Award className="h-4 w-4" />Awarded: {fmt(result.awardedDate)}</span>}
          {result.location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{result.location}</span>}
        </div>

        <a href={pdfHref} target="_blank" rel="noopener noreferrer"
           className="mt-5 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500">
          <Download className="h-4 w-4" /> Download PDF
        </a>

        <div className="mt-8">
          <ResultPdfViewer url={pdfHref} />
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Verify it builds**

Run (from `frontend/`):

```bash
npx tsc --noEmit
```

Expected: no type errors. If `react-pdf` types complain about the CSS imports, ensure `frontend/next.config.ts` already allows CSS imports from node_modules (Next handles this by default — no change expected).

- [ ] **Step 5: Manual check (with dev servers running)**

Upload a result via the admin UI in Task 8, then visit `/results/<id>` on a desktop and a phone-sized viewport. Expected: PDF pages render inline and scale to width; Download works. (If doing tasks in order, run this check after Task 8.)

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/results/ResultPdfViewer.tsx frontend/src/app/results/[id]/page.tsx frontend/package.json frontend/package-lock.json
git commit -m "feat(results): inline PDF viewer and public detail page"
```

---

## Task 8: Admin management UI

**Files:**
- Create: `frontend/src/components/dashboard/ResultsManager.tsx`
- Modify: `frontend/src/components/dashboard/AdminDashboard.tsx`

- [ ] **Step 1: Write the `ResultsManager` component**

Create `frontend/src/components/dashboard/ResultsManager.tsx`:

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Plus, Trash2, Pencil, Upload, Loader2, X, QrCode, Eye, EyeOff, Download, Link as LinkIcon } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { buildResultUrl } from "@/lib/resultLinks";

interface ExamResult {
  id: string;
  title: string;
  testDate: string | null;
  awardedDate: string | null;
  location: string | null;
  pdfUrl: string;
  isPublished: boolean;
}

const emptyForm = { id: "", title: "", testDate: "", awardedDate: "", location: "", pdfUrl: "", isPublished: true };

function toInputDate(d: string | null): string {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export default function ResultsManager() {
  const { showToast } = useToast();
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [qrFor, setQrFor] = useState<ExamResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const qrCanvasWrapRef = useRef<HTMLDivElement>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/exam-results");
      setResults(res.data.data.results);
    } catch {
      showToast("Failed to load results", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  const openCreate = () => { setForm(emptyForm); setShowForm(true); };
  const openEdit = (r: ExamResult) => {
    setForm({
      id: r.id, title: r.title, testDate: toInputDate(r.testDate),
      awardedDate: toInputDate(r.awardedDate), location: r.location || "",
      pdfUrl: r.pdfUrl, isPublished: r.isPublished,
    });
    setShowForm(true);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") { showToast("Please choose a PDF", "error"); return; }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file); // upload field name is "image" (uploadController.uploadImage)
      const up = await api.post("/upload?folder=results", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const pdfUrl = up.data.data.url;

      // Best-effort auto-fill from the PDF header.
      let suggestions: any = {};
      try {
        const parsed = await api.post("/exam-results/parse", { pdfUrl });
        suggestions = parsed.data.data.suggestions || {};
      } catch { /* ignore */ }

      setForm((f) => ({
        ...f,
        pdfUrl,
        title: f.title || suggestions.title || "",
        location: f.location || suggestions.location || "",
        testDate: f.testDate || toInputDate(suggestions.testDate || null),
        awardedDate: f.awardedDate || toInputDate(suggestions.awardedDate || null),
      }));
      showToast("PDF uploaded", "success");
    } catch {
      showToast("Upload failed", "error");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async () => {
    if (!form.title || !form.pdfUrl) { showToast("Title and a PDF are required", "error"); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        pdfUrl: form.pdfUrl,
        testDate: form.testDate || null,
        awardedDate: form.awardedDate || null,
        location: form.location || null,
        isPublished: form.isPublished,
      };
      if (form.id) await api.patch(`/exam-results/${form.id}`, payload);
      else await api.post("/exam-results", payload);
      showToast("Saved", "success");
      setShowForm(false);
      fetchResults();
    } catch {
      showToast("Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (r: ExamResult) => {
    try {
      await api.patch(`/exam-results/${r.id}`, { isPublished: !r.isPublished });
      fetchResults();
    } catch { showToast("Update failed", "error"); }
  };

  const remove = async (r: ExamResult) => {
    if (!confirm(`Delete "${r.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/exam-results/${r.id}`);
      showToast("Deleted", "success");
      fetchResults();
    } catch { showToast("Delete failed", "error"); }
  };

  const copyLink = (r: ExamResult) => {
    navigator.clipboard.writeText(buildResultUrl(origin, r.id));
    showToast("Link copied", "success");
  };

  const downloadQr = (r: ExamResult) => {
    const canvas = qrCanvasWrapRef.current?.querySelector("canvas");
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `result-qr-${r.id}.png`;
    a.click();
  };

  return (
    <div className="text-white">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Belt Test Results</h2>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium hover:bg-red-500">
          <Plus className="h-4 w-4" /> New Result
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-red-500" /></div>
      ) : results.length === 0 ? (
        <p className="py-16 text-center text-gray-500">No results yet. Click “New Result” to upload one.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-left text-xs uppercase text-gray-400">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Test date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id} className="border-t border-white/[0.06]">
                  <td className="px-4 py-3 font-medium">{r.title}</td>
                  <td className="px-4 py-3 text-gray-400">{r.testDate ? new Date(r.testDate).toLocaleDateString("en-IN") : "—"}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => togglePublish(r)} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${r.isPublished ? "bg-green-900/40 text-green-300" : "bg-gray-700/40 text-gray-400"}`}>
                      {r.isPublished ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {r.isPublished ? "Published" : "Hidden"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button title="QR code" onClick={() => setQrFor(r)} className="rounded p-1.5 hover:bg-white/10"><QrCode className="h-4 w-4" /></button>
                      <button title="Copy link" onClick={() => copyLink(r)} className="rounded p-1.5 hover:bg-white/10"><LinkIcon className="h-4 w-4" /></button>
                      <button title="Edit" onClick={() => openEdit(r)} className="rounded p-1.5 hover:bg-white/10"><Pencil className="h-4 w-4" /></button>
                      <button title="Delete" onClick={() => remove(r)} className="rounded p-1.5 text-red-400 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d0d0d] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{form.id ? "Edit Result" : "New Result"}</h3>
              <button onClick={() => setShowForm(false)} className="rounded p-1 hover:bg-white/10"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-gray-400">PDF file</label>
                <input ref={fileRef} type="file" accept="application/pdf" onChange={handleFile} className="hidden" />
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {form.pdfUrl ? "Replace PDF" : "Upload PDF"}
                </button>
                {form.pdfUrl && <span className="ml-3 text-xs text-green-400">PDF attached</span>}
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-400">Title</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm" placeholder="Belt Test — Durg, Chhattisgarh" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Test date</label>
                  <input type="date" value={form.testDate} onChange={(e) => setForm({ ...form, testDate: e.target.value })}
                    className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Awarded date</label>
                  <input type="date" value={form.awardedDate} onChange={(e) => setForm({ ...form, awardedDate: e.target.value })}
                    className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-400">Location</label>
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm" placeholder="Mas Oyama Karate Academy, Khursipar" />
              </div>

              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
                Published (visible to public)
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
              <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium hover:bg-red-500 disabled:opacity-50">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR modal */}
      {qrFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setQrFor(null)}>
          <div className="w-full max-w-xs rounded-2xl border border-white/10 bg-[#0d0d0d] p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-1 text-base font-semibold">{qrFor.title}</h3>
            <p className="mb-4 break-all text-xs text-gray-500">{buildResultUrl(origin, qrFor.id)}</p>
            <div ref={qrCanvasWrapRef} className="mx-auto inline-block rounded-lg bg-white p-3">
              <QRCodeCanvas value={buildResultUrl(origin, qrFor.id)} size={200} />
            </div>
            <div className="mt-5 flex justify-center gap-3">
              <button onClick={() => downloadQr(qrFor)} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm hover:bg-red-500">
                <Download className="h-4 w-4" /> Download PNG
              </button>
              <button onClick={() => setQrFor(null)} className="rounded-lg px-3 py-2 text-sm text-gray-400 hover:text-white">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

> The upload field name `image` matches `uploadController.uploadImage = upload.single('image')`. Confirm `backend/src/routes/uploadRoutes.ts` mounts `uploadImage` + `handleUpload` on the route the frontend posts to (`/api/upload`). If the route expects a different field name, match it.

- [ ] **Step 2: Register the tab in `AdminDashboard.tsx`**

Make four edits in `frontend/src/components/dashboard/AdminDashboard.tsx`:

(a) Add the lazy import alongside the others (~line 38):

```tsx
const ResultsManager = lazy(() => import('./ResultsManager'));
```

(b) Add `'results'` to the `TabId` type (line 57) and to the `VALID_TABS` array (line 59). For example, change the end of each from `'anonymous-messages'` to `'anonymous-messages' | 'results'` (type) and add `'results'` to the array.

(c) Add a menu item in the "CONTENT" section's `items` array (the section starting ~line 161, where `albums`/`blogs` live):

```tsx
                { id: 'results', label: 'Belt Test Results', icon: FileText },
```

`FileText` is already imported in this file (used elsewhere) — verify it's in the lucide import list at the top; if not, add it.

(d) Add the render line alongside the other `activeTab === ...` blocks (~line 685):

```tsx
                        {activeTab === 'results' && <motion.div key="results" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}><Suspense fallback={<TabLoader />}><ResultsManager /></Suspense></motion.div>}
```

- [ ] **Step 3: Verify it builds**

Run (from `frontend/`):

```bash
npx tsc --noEmit
```

Expected: no type errors. Common gotchas: `qrcode.react` exports `QRCodeCanvas` (named import) — confirm; `FileText` imported from `lucide-react`.

- [ ] **Step 4: End-to-end manual verification**

With backend + frontend dev servers running and logged in as an ADMIN:
1. Go to `/management?tab=results` → "New Result" → upload `Belt test Result Chhattisghar 14.06.2026.pdf`.
2. Confirm title/dates/location auto-fill (best-effort) and edit as desired → Save.
3. Confirm the row appears; toggle publish; open the QR modal; Download PNG; Copy link.
4. Open the copied link in a new tab → `/results/[id]` renders both PDF pages.
5. Visit `/results` → the new result is listed.

Expected: all steps succeed. If auto-fill returns blank, that's acceptable (best-effort) — fields are editable.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/dashboard/ResultsManager.tsx frontend/src/components/dashboard/AdminDashboard.tsx
git commit -m "feat(results): admin management UI with QR codes"
```

---

## Task 9: Final verification

- [ ] **Step 1: Full type-check both packages**

Run:

```bash
cd backend && npx tsc --noEmit && cd ../frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2: Run frontend unit tests**

Run (from `frontend/`):

```bash
npx vitest run
```

Expected: all tests pass (including `resultLinks.test.ts`).

- [ ] **Step 3: Run the parser verification**

Run (from `backend/`):

```bash
npx ts-node src/utils/parseResultPdf.check.ts
```

Expected: `OK {...}`.

- [ ] **Step 4: Confirm the full flow once more** (the Task 8 Step 4 checklist) on both desktop and a mobile viewport, since QR scans open on phones.

---

## Spec coverage check

- PDF-as-is display → Task 7 (react-pdf viewer). ✓
- Public access, no login → Tasks 4/6/7 public pages + public GET routes. ✓
- Per-result QR opening that result → Task 8 QR (encodes `/results/[id]`) + Task 7 page. ✓
- Many results + management (upload/edit/delete/publish) → Tasks 4 + 8 + API in Task 4. ✓
- Metadata (title/test date/awarded date/location) auto-filled from PDF, editable → Task 2 parser + Task 4 parse endpoint + Task 8 form. ✓
- 5 MB → 15 MB upload bump → Task 3. ✓
- Separate from existing tournament/belt-exam results → new `/api/exam-results` + `ExamResult` model. ✓
```
