import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { AppError } from '../utils/errorHandler';

// Supabase Storage client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const BUCKET = 'uploads';

// Use memory storage (buffer) instead of disk — we upload to Supabase
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

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from(BUCKET)
            .upload(filePath, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: false,
            });

        if (error) {
            console.error('[UPLOAD ERROR] Supabase:', error.message);
            return next(new AppError('File upload failed: ' + error.message, 500));
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
            .from(BUCKET)
            .getPublicUrl(filePath);

        const fileUrl = publicUrlData.publicUrl;

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

