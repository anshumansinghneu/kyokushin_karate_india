"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.approvePost = exports.deletePost = exports.updatePost = exports.createPost = exports.getPostBySlug = exports.getPost = exports.getAllPosts = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const catchAsync_1 = require("../utils/catchAsync");
const errorHandler_1 = require("../utils/errorHandler");
exports.getAllPosts = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { type, status } = req.query;
    const where = {};
    if (type) {
        where.type = type;
    }
    if (status) {
        if (status !== 'ALL') {
            where.status = status;
        }
    }
    else {
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
    const posts = await prisma_1.default.post.findMany({
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
exports.getPost = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const post = await prisma_1.default.post.findUnique({
        where: { id: req.params.id },
        include: {
            author: {
                select: { name: true }
            }
        }
    });
    if (!post) {
        return next(new errorHandler_1.AppError('No post found with that ID', 404));
    }
    res.status(200).json({
        status: 'success',
        data: {
            post
        }
    });
});
exports.getPostBySlug = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const post = await prisma_1.default.post.findUnique({
        where: { slug: req.params.slug },
        include: {
            author: {
                select: { name: true }
            }
        }
    });
    if (!post) {
        return next(new errorHandler_1.AppError('No post found with that slug', 404));
    }
    res.status(200).json({
        status: 'success',
        data: {
            post
        }
    });
});
exports.createPost = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
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
        const newPost = await prisma_1.default.post.create({
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
                status: status,
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
    }
    catch (error) {
        console.error("Error creating post:", error);
        return next(new errorHandler_1.AppError('Failed to create post. Slug might be duplicate.', 400));
    }
});
exports.updatePost = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const post = await prisma_1.default.post.update({
        where: { id: req.params.id },
        data: req.body
    });
    res.status(200).json({
        status: 'success',
        data: {
            post
        }
    });
});
exports.deletePost = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    await prisma_1.default.post.delete({
        where: { id: req.params.id }
    });
    res.status(204).json({
        status: 'success',
        data: null
    });
});
exports.approvePost = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const post = await prisma_1.default.post.update({
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
