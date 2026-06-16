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
