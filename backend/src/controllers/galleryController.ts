import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/errorHandler';

// GET /api/gallery — Public: fetch approved gallery items
export const getGalleryItems = catchAsync(async (req: Request, res: Response) => {
    const { category, eventId, dojoId, page = '1', limit = '24' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const where: any = { isApproved: true };

    if (category === 'featured') {
        where.isPublicFeatured = true;
    }
    if (eventId) where.eventId = eventId;
    if (dojoId) where.dojoId = dojoId;

    const [items, total] = await Promise.all([
        prisma.gallery.findMany({
            where,
            include: {
                uploader: { select: { id: true, name: true } },
                event: { select: { id: true, name: true } },
                dojo: { select: { id: true, name: true } },
            },
            orderBy: { uploadedAt: 'desc' },
            skip,
            take: limitNum,
        }),
        prisma.gallery.count({ where }),
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            items,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        },
    });
});

// POST /api/gallery — Auth: upload a gallery image
export const uploadGalleryItem = catchAsync(async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user.id;
    // @ts-ignore
    const userRole = req.user.role;

    const { imageUrl, caption, eventId, dojoId } = req.body;

    if (!imageUrl) {
        throw new AppError('imageUrl is required', 400);
    }

    // Auto-approve for ADMIN and INSTRUCTOR
    const autoApprove = userRole === 'ADMIN' || userRole === 'INSTRUCTOR';

    const item = await prisma.gallery.create({
        data: {
            uploadedBy: userId,
            imageUrl,
            caption: caption || null,
            eventId: eventId || null,
            dojoId: dojoId || null,
            isApproved: autoApprove,
            approvedBy: autoApprove ? userId : null,
            approvedAt: autoApprove ? new Date() : null,
        },
        include: {
            uploader: { select: { id: true, name: true } },
            event: { select: { id: true, name: true } },
            dojo: { select: { id: true, name: true } },
        },
    });

    res.status(201).json({
        status: 'success',
        data: { item },
    });
});

// GET /api/gallery/pending — Admin/Instructor: fetch pending gallery items
export const getPendingGalleryItems = catchAsync(async (req: Request, res: Response) => {
    const items = await prisma.gallery.findMany({
        where: { isApproved: false },
        include: {
            uploader: { select: { id: true, name: true } },
            event: { select: { id: true, name: true } },
            dojo: { select: { id: true, name: true } },
        },
        orderBy: { uploadedAt: 'desc' },
    });

    res.status(200).json({
        status: 'success',
        data: { items },
    });
});

// PATCH /api/gallery/:id/approve — Admin: approve a gallery item
export const approveGalleryItem = catchAsync(async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user.id;
    const { id } = req.params;
    const { isPublicFeatured } = req.body;

    const item = await prisma.gallery.update({
        where: { id },
        data: {
            isApproved: true,
            approvedBy: userId,
            approvedAt: new Date(),
            isPublicFeatured: isPublicFeatured || false,
        },
    });

    res.status(200).json({
        status: 'success',
        data: { item },
    });
});

// PATCH /api/gallery/:id/feature — Admin: toggle featured status
export const toggleFeatured = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const existing = await prisma.gallery.findUnique({ where: { id } });
    if (!existing) throw new AppError('Gallery item not found', 404);

    const item = await prisma.gallery.update({
        where: { id },
        data: { isPublicFeatured: !existing.isPublicFeatured },
    });

    res.status(200).json({
        status: 'success',
        data: { item },
    });
});

// DELETE /api/gallery/:id — Admin or uploader can delete
export const deleteGalleryItem = catchAsync(async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user.id;
    // @ts-ignore
    const userRole = req.user.role;
    const { id } = req.params;

    const item = await prisma.gallery.findUnique({ where: { id } });
    if (!item) throw new AppError('Gallery item not found', 404);

    // Only admin or the uploader can delete
    if (userRole !== 'ADMIN' && item.uploadedBy !== userId) {
        throw new AppError('You do not have permission to delete this item', 403);
    }

    await prisma.gallery.delete({ where: { id } });

    res.status(204).json({
        status: 'success',
        data: null,
    });
});
