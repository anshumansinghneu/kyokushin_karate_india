import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { AppError } from '../utils/errorHandler';
import { sniffFileType } from '../utils/fileType';

// Supabase Storage client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const BUCKET = 'uploads';

// Where an upload may go. The folder came straight from the query string and was joined
// into a filesystem path, so "../" could write anywhere; only the site's own folders now.
const ALLOWED_FOLDERS = new Set(['general', 'gallery', 'albums', 'delegations', 'profiles', 'results']);


// Use memory storage (buffer) — we decide where to write later
const storage = multer.memoryStorage();

// A first, cheap gate on the declared type; the bytes are checked after upload.
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if ((file.mimetype.startsWith('image/') && file.mimetype !== 'image/svg+xml') || file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new AppError('Not a valid file! Please upload only images or PDFs.', 400) as any, false);
    }
};

// Single files may be large result PDFs; batches are gallery photos (the site caps those
// at 5 MB each), kept small enough that one request cannot exhaust the server's memory.
export const uploadImage = multer({ storage, fileFilter, limits: { fileSize: 15 * 1024 * 1024 } }).single('image');
export const uploadImages = multer({ storage, fileFilter, limits: { fileSize: 8 * 1024 * 1024, files: 20 } }).array('images', 20);

// Upload to Supabase Storage; returns the public URL, or null if storage is unavailable.
async function trySupabaseUpload(filePath: string, buffer: Buffer, contentType: string): Promise<string | null> {
    try {
        if (!supabaseUrl || !supabaseServiceKey) return null;

        const { error } = await supabase.storage
            .from(BUCKET)
            .upload(filePath, buffer, { contentType, upsert: false });

        if (error) {
            console.error('[UPLOAD] Supabase failed:', error.message);
            return null;
        }

        const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
        return publicUrlData.publicUrl;
    } catch (err: any) {
        console.error('[UPLOAD] Supabase unreachable:', err.message || err);
        return null;
    }
}

/**
 * Store one file and return its public URL. There is deliberately no local fallback: the
 * server's disk is wiped on every deploy, so a file saved there looked uploaded and then
 * vanished (a published result PDF was lost this way). If storage is down, say so.
 */
async function storeFile(file: Express.Multer.File, folderParam: unknown): Promise<{ url: string; filename: string; path: string }> {
    const folder = typeof folderParam === 'string' && folderParam ? folderParam : 'general';
    if (!ALLOWED_FOLDERS.has(folder)) throw new AppError('Unknown upload folder', 400);

    const kind = sniffFileType(file.buffer);
    if (!kind) throw new AppError(`${file.originalname || 'That file'} is not a supported image or PDF.`, 400);

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = `${file.fieldname}-${uniqueSuffix}${kind.ext}`;
    const filePath = `${folder}/${filename}`;

    const url = await trySupabaseUpload(filePath, file.buffer, kind.type);
    if (!url) throw new AppError('File storage is unavailable right now. Please try again in a minute.', 503);
    return { url, filename, path: filePath };
}

// Handle multiple file uploads
export const handleMultiUpload = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
            return next(new AppError('Please upload at least one file', 400));
        }

        const results = [];
        for (const file of files) {
            results.push(await storeFile(file, req.query.folder));
        }

        res.status(200).json({
            status: 'success',
            data: { files: results },
        });
    } catch (err: any) {
        if (err instanceof AppError) return next(err);
        console.error('[MULTI UPLOAD ERROR]', err);
        return next(new AppError('Upload failed', 500));
    }
};

export const handleUpload = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.file) {
            return next(new AppError('Please upload a file', 400));
        }

        const stored = await storeFile(req.file, req.query.folder);

        res.status(200).json({
            status: 'success',
            data: stored,
        });
    } catch (err: any) {
        if (err instanceof AppError) return next(err);
        console.error('[UPLOAD ERROR]', err);
        return next(new AppError('Upload failed', 500));
    }
};
