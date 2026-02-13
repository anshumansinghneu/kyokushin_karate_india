import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/errorHandler';

export const getAllPosts = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { type, status } = req.query;

    const where: any = {};
    if (type) {
        where.type = type;
    }
    if (status) {
        if (status !== 'ALL') {
            where.status = status;
        }
    } else {
        // Default: only show published posts for public API
        // Admin API should explicitly request status=ALL or specific status
        where.status = 'PUBLISHED';
    }

    // Allow overriding default if explicitly requested (e.g. by Admin)
    if (req.query.status === 'ALL') {
        delete where.status;
    }

    if (req.query.authorId) {
        where.authorId = req.query.authorId;
        // If filtering by specific author, allow seeing all statuses (e.g. for that author's dashboard)
        // unless status is explicitly specified
        if (!status) {
            delete where.status;
        }
    }

    const posts = await prisma.post.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        include: {
            author: {
                select: { name: true }
            }
        }
    });

    res.status(200).json({
        status: 'success',
        results: posts.length,
        data: {
            posts
        }
    });
});

export const getPost = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const post = await prisma.post.findUnique({
        where: { id: req.params.id },
        include: {
            author: {
                select: { name: true }
            }
        }
    });

    if (!post) {
        return next(new AppError('No post found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            post
        }
    });
});

export const getPostBySlug = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const post = await prisma.post.findUnique({
        where: { slug: req.params.slug },
        include: {
            author: {
                select: { name: true }
            }
        }
    });

    if (!post) {
        return next(new AppError('No post found with that slug', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            post
        }
    });
});

export const createPost = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const userId = req.user.id;
    // @ts-ignore
    const userRole = req.user.role; // Assuming role is available on req.user

    console.log("Creating post with body:", req.body);

    const { type, title, slug, content, excerpt, imageUrl, externalLink, sourceName, attachmentUrl, publishedAt } = req.body;

    // Basic slug generation if not provided
    const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    // Determine status
    let status = 'PENDING';
    if (userRole === 'ADMIN') {
        status = 'PUBLISHED';
    }

    try {
        const newPost = await prisma.post.create({
            data: {
                type,
                title,
                slug: finalSlug,
                content,
                excerpt,
                imageUrl,
                externalLink,
                sourceName,
                attachmentUrl,
                status: status as any,
                publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
                authorId: userId
            }
        });

        res.status(201).json({
            status: 'success',
            data: {
                post: newPost
            }
        });
    } catch (error) {
        console.error("Error creating post:", error);
        return next(new AppError('Failed to create post. Slug might be duplicate.', 400));
    }
});

export const updatePost = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { type, title, slug, content, excerpt, imageUrl, externalLink, sourceName, attachmentUrl, status, publishedAt } = req.body;

    // Build update data with only valid Post model fields (exclude authorId, id, createdAt)
    const updateData: any = {};
    if (type !== undefined) updateData.type = type;
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (content !== undefined) updateData.content = content;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (externalLink !== undefined) updateData.externalLink = externalLink;
    if (sourceName !== undefined) updateData.sourceName = sourceName;
    if (attachmentUrl !== undefined) updateData.attachmentUrl = attachmentUrl;
    if (status !== undefined) updateData.status = status;
    if (publishedAt !== undefined) updateData.publishedAt = new Date(publishedAt);

    try {
        const post = await prisma.post.update({
            where: { id: req.params.id },
            data: updateData
        });

        res.status(200).json({
            status: 'success',
            data: {
                post
            }
        });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return next(new AppError('No post found with that ID', 404));
        }
        throw error;
    }
});

export const deletePost = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    await prisma.post.delete({
        where: { id: req.params.id }
    });

    res.status(204).json({
        status: 'success',
        data: null
    });
});

export const approvePost = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const post = await prisma.post.update({
        where: { id: req.params.id },
        data: { status: 'PUBLISHED' }
    });

    res.status(200).json({
        status: 'success',
        data: {
            post
        }
    });
});
