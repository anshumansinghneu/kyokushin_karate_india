import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { AppError } from '../utils/errorHandler';

// Supabase Storage client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const BUCKET = 'uploads';

// Local uploads directory (fallback when Supabase is unavailable)
const LOCAL_UPLOADS_DIR = path.join(__dirname, '../uploads');

// Use memory storage (buffer) — we decide where to write later
const storage = multer.memoryStorage();

// File Filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new AppError('Not a valid file! Please upload only images or PDFs.', 400) as any, false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

export const uploadImage = upload.single('image');

// Try uploading to Supabase, returns URL or null on failure
async function trySupabaseUpload(filePath: string, buffer: Buffer, contentType: string): Promise<string | null> {
    try {
        if (!supabaseUrl || !supabaseServiceKey) return null;

        const { data, error } = await supabase.storage
            .from(BUCKET)
            .upload(filePath, buffer, { contentType, upsert: false });

        if (error) {
            console.warn('[UPLOAD] Supabase failed:', error.message);
            return null;
        }

        const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
        return publicUrlData.publicUrl;
    } catch (err: any) {
        console.warn('[UPLOAD] Supabase unreachable:', err.message || err);
        return null;
    }
}

// Fallback: save to local filesystem and return relative URL
function saveLocally(filePath: string, buffer: Buffer): string {
    const fullPath = path.join(LOCAL_UPLOADS_DIR, filePath);
    const dir = path.dirname(fullPath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, buffer);
    // Return relative URL that express.static will serve
    return `/uploads/${filePath}`;
}

export const handleUpload = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.file) {
            return next(new AppError('Please upload a file', 400));
        }

        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(req.file.originalname);
        const filename = `${req.file.fieldname}-${uniqueSuffix}${ext}`;

        // Determine folder based on context (profile photos, gallery, etc.)
        const folder = (req.query.folder as string) || 'general';
        const filePath = `${folder}/${filename}`;

        // Try Supabase first, fall back to local filesystem
        let fileUrl = await trySupabaseUpload(filePath, req.file.buffer, req.file.mimetype);

        if (!fileUrl) {
            console.log('[UPLOAD] Using local filesystem fallback');
            fileUrl = saveLocally(filePath, req.file.buffer);
        }

        res.status(200).json({
            status: 'success',
            data: {
                url: fileUrl,
                filename,
                path: filePath,
            },
        });
    } catch (err: any) {
        console.error('[UPLOAD ERROR]', err);
        return next(new AppError('Upload failed', 500));
    }
};
