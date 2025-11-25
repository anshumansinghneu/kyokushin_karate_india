import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/errorHandler';

export const getAllContent = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const content = await prisma.siteContent.findMany();

    // Convert array to object for easier frontend consumption { key: value }
    const contentMap = content.reduce((acc: any, item) => {
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

export const updateContent = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { key } = req.params;
    const { value, type, description } = req.body;

    const updatedContent = await prisma.siteContent.upsert({
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
export const initializeContent = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const defaults = [
        { key: 'home_hero_image', value: '/images/hero-bg.jpg', type: 'IMAGE', description: 'Main banner image on Home Page' },
        { key: 'home_welcome_text', value: 'Welcome to Kyokushin Karate', type: 'TEXT', description: 'Main heading on Home Page' },
        { key: 'mas_oyama_image', value: '/images/mas-oyama.jpg', type: 'IMAGE', description: 'Portrait of Mas Oyama' },
        { key: 'tournament_banner', value: '/images/tournament-banner.jpg', type: 'IMAGE', description: 'Banner for Tournament Page' },
    ];

    for (const item of defaults) {
        await prisma.siteContent.upsert({
            where: { key: item.key },
            update: {}, // Do nothing if exists
            create: {
                key: item.key,
                value: item.value,
                type: item.type as any,
                description: item.description
            }
        });
    }

    res.status(200).json({
        status: 'success',
        message: 'Default content initialized'
    });
});
