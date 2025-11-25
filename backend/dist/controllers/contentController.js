"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeContent = exports.updateContent = exports.getAllContent = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const catchAsync_1 = require("../utils/catchAsync");
exports.getAllContent = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const content = await prisma_1.default.siteContent.findMany();
    // Convert array to object for easier frontend consumption { key: value }
    const contentMap = content.reduce((acc, item) => {
        acc[item.key] = item;
        return acc;
    }, {});
    res.status(200).json({
        status: 'success',
        results: content.length,
        data: {
            content: contentMap
        }
    });
});
exports.updateContent = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { key } = req.params;
    const { value, type, description } = req.body;
    const updatedContent = await prisma_1.default.siteContent.upsert({
        where: { key },
        update: {
            value,
            // Only update type/description if provided
            ...(type && { type }),
            ...(description && { description })
        },
        create: {
            key,
            value,
            type: type || 'TEXT',
            description: description || ''
        }
    });
    res.status(200).json({
        status: 'success',
        data: {
            content: updatedContent
        }
    });
});
// Initialize default content (can be called once or on startup)
exports.initializeContent = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const defaults = [
        { key: 'home_hero_image', value: '/images/hero-bg.jpg', type: 'IMAGE', description: 'Main banner image on Home Page' },
        { key: 'home_welcome_text', value: 'Welcome to Kyokushin Karate', type: 'TEXT', description: 'Main heading on Home Page' },
        { key: 'mas_oyama_image', value: '/images/mas-oyama.jpg', type: 'IMAGE', description: 'Portrait of Mas Oyama' },
        { key: 'tournament_banner', value: '/images/tournament-banner.jpg', type: 'IMAGE', description: 'Banner for Tournament Page' },
    ];
    for (const item of defaults) {
        await prisma_1.default.siteContent.upsert({
            where: { key: item.key },
            update: {}, // Do nothing if exists
            create: {
                key: item.key,
                value: item.value,
                type: item.type,
                description: item.description
            }
        });
    }
    res.status(200).json({
        status: 'success',
        message: 'Default content initialized'
    });
});
