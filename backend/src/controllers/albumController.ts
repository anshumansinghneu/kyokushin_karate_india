import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/errorHandler';

// GET /api/albums — Public: list albums
export const getAlbums = catchAsync(async (req: Request, res: Response) => {
    const { type, search, page = '1', limit = '24' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 24));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (type && type !== 'ALL') where.type = type;
    if (search) where.name = { contains: search as string, mode: 'insensitive' };

    const [albums, total] = await Promise.all([
        prisma.album.findMany({
            where,
            include: {
                creator: { select: { id: true, name: true } },
                event: { select: { id: true, name: true } },
                _count: { select: { photos: true } },
            },
            orderBy: [{ isPinned: 'desc' }, { date: 'desc' }, { createdAt: 'desc' }],
            skip,
            take: limitNum,
        }),
        prisma.album.count({ where }),
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            albums: albums.map(a => ({
                ...a,
                photoCount: a._count.photos,
                _count: undefined,
            })),
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        },
    });
});

// GET /api/albums/:id — Public: album detail with photos
export const getAlbum = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { page = '1', limit = '24' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 24));
    const skip = (pageNum - 1) * limitNum;

    const album = await prisma.album.findUnique({
        where: { id },
        include: {
            creator: { select: { id: true, name: true } },
            event: { select: { id: true, name: true } },
            _count: { select: { photos: true } },
        },
    });

    if (!album) return next(new AppError('Album not found', 404));

    const photos = await prisma.albumPhoto.findMany({
        where: { albumId: id },
        include: {
            gallery: {
                include: {
                    uploader: { select: { id: true, name: true } },
                },
            },
        },
        orderBy: { order: 'asc' },
        skip,
        take: limitNum,
    });

    res.status(200).json({
        status: 'success',
        data: {
            album: {
                ...album,
                photoCount: album._count.photos,
                _count: undefined,
            },
            photos: photos.map(p => ({
                ...p.gallery,
                albumPhotoId: p.id,
                order: p.order,
            })),
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: album._count.photos,
                totalPages: Math.ceil(album._count.photos / limitNum),
            },
        },
    });
});

// POST /api/albums — Admin: create album
export const createAlbum = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { name, description, coverImageUrl, type, date, eventId } = req.body;

    if (!name) throw new AppError('Album name is required', 400);

    // If linking to an event, check it exists and isn't already linked
    if (eventId) {
        const existing = await prisma.album.findUnique({ where: { eventId } });
        if (existing) throw new AppError('This event already has an album', 400);
    }

    const album = await prisma.album.create({
        data: {
            name,
            description: description || null,
            coverImageUrl: coverImageUrl || null,
            type: type || 'GENERAL',
            date: date ? new Date(date) : null,
            eventId: eventId || null,
            createdBy: userId,
        },
        include: {
            creator: { select: { id: true, name: true } },
            event: { select: { id: true, name: true } },
            _count: { select: { photos: true } },
        },
    });

    res.status(201).json({
        status: 'success',
        data: { album: { ...album, photoCount: album._count.photos, _count: undefined } },
    });
});

// PATCH /api/albums/:id — Admin: update album
export const updateAlbum = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { name, description, coverImageUrl, type, date, isPinned } = req.body;

    const existing = await prisma.album.findUnique({ where: { id } });
    if (!existing) return next(new AppError('Album not found', 404));

    // If pinning this album, unpin all others
    if (isPinned === true) {
        await prisma.album.updateMany({ where: { isPinned: true }, data: { isPinned: false } });
    }

    const album = await prisma.album.update({
        where: { id },
        data: {
            ...(name !== undefined && { name }),
            ...(description !== undefined && { description }),
            ...(coverImageUrl !== undefined && { coverImageUrl }),
            ...(type !== undefined && { type }),
            ...(date !== undefined && { date: date ? new Date(date) : null }),
            ...(isPinned !== undefined && { isPinned }),
        },
        include: {
            creator: { select: { id: true, name: true } },
            event: { select: { id: true, name: true } },
            _count: { select: { photos: true } },
        },
    });

    res.status(200).json({
        status: 'success',
        data: { album: { ...album, photoCount: album._count.photos, _count: undefined } },
    });
});

// DELETE /api/albums/:id — Admin: delete album (keeps photos)
export const deleteAlbum = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const existing = await prisma.album.findUnique({ where: { id } });
    if (!existing) return next(new AppError('Album not found', 404));

    await prisma.album.delete({ where: { id } });

    res.status(204).json({ status: 'success', data: null });
});

// POST /api/albums/:id/photos — Admin: add photos to album
export const addPhotosToAlbum = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { galleryIds } = req.body;

    if (!galleryIds || !Array.isArray(galleryIds) || galleryIds.length === 0) {
        throw new AppError('galleryIds array is required', 400);
    }

    const album = await prisma.album.findUnique({ where: { id } });
    if (!album) return next(new AppError('Album not found', 404));

    // Get current max order
    const maxOrder = await prisma.albumPhoto.findFirst({
        where: { albumId: id },
        orderBy: { order: 'desc' },
        select: { order: true },
    });
    let nextOrder = (maxOrder?.order ?? -1) + 1;

    // Create links, skipping duplicates
    const created = [];
    for (const galleryId of galleryIds) {
        try {
            const link = await prisma.albumPhoto.create({
                data: { albumId: id, galleryId, order: nextOrder++ },
            });
            created.push(link);
        } catch (e: any) {
            // Skip duplicate constraint violations
            if (e.code !== 'P2002') throw e;
        }
    }

    res.status(200).json({
        status: 'success',
        data: { added: created.length },
    });
});

// DELETE /api/albums/:id/photos/:photoId — Admin: remove photo from album
export const removePhotoFromAlbum = catchAsync(async (req: Request, res: Response) => {
    const { id, photoId } = req.params;

    await prisma.albumPhoto.deleteMany({
        where: { albumId: id, galleryId: photoId },
    });

    res.status(204).json({ status: 'success', data: null });
});

// PATCH /api/albums/:id/photos/reorder — Admin: reorder photos
export const reorderPhotos = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { orders } = req.body;

    if (!orders || !Array.isArray(orders)) {
        throw new AppError('orders array is required', 400);
    }

    const album = await prisma.album.findUnique({ where: { id } });
    if (!album) return next(new AppError('Album not found', 404));

    await Promise.all(
        orders.map((item: { galleryId: string; order: number }) =>
            prisma.albumPhoto.updateMany({
                where: { albumId: id, galleryId: item.galleryId },
                data: { order: item.order },
            })
        )
    );

    res.status(200).json({ status: 'success', message: 'Photos reordered' });
});
