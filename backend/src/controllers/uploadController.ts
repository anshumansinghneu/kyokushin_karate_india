import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { AppError } from '../utils/errorHandler';

// Configure Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'src/uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File Filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new AppError('Not a valid file! Please upload only images or PDFs.', 400) as any, false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

export const uploadImage = upload.single('image');

export const handleUpload = (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
        return next(new AppError('Please upload a file', 400));
    }

    // Construct URL using backend URL
    // Use environment variable or construct from actual backend host
    const backendUrl = process.env.BACKEND_URL || 'https://kyokushin-api.onrender.com';
    const fileUrl = `${backendUrl}/uploads/${req.file.filename}`;

    res.status(200).json({
        status: 'success',
        data: {
            url: fileUrl,
            filename: req.file.filename
        }
    });
};
