import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../utils/errorHandler';
import { catchAsync } from '../utils/catchAsync';

export const getAllDojos = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { country, state } = req.query;
    const where: any = {};
    if (country) where.country = country;
    if (state) where.state = state;

    const dojos = await prisma.dojo.findMany({
        where,
        include: {
            instructors: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
    });

    res.status(200).json({
        status: 'success',
        results: dojos.length,
        data: {
            dojos,
        },
    });
});

export const getDojoLocations = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const dojos = await prisma.dojo.findMany({
        select: {
            country: true,
            state: true,
            city: true
        }
    });

    // Process to get unique structure
    const locations: any = {};

    dojos.forEach(dojo => {
        if (!dojo.country) return;

        if (!locations[dojo.country]) {
            locations[dojo.country] = {};
        }

        if (dojo.state) {
            if (!locations[dojo.country][dojo.state]) {
                locations[dojo.country][dojo.state] = new Set();
            }
            if (dojo.city) {
                locations[dojo.country][dojo.state].add(dojo.city);
            }
        }
    });

    // Convert Sets to Arrays
    const formattedLocations: any = {};
    Object.keys(locations).forEach(country => {
        formattedLocations[country] = {};
        Object.keys(locations[country]).forEach(state => {
            formattedLocations[country][state] = Array.from(locations[country][state]).sort();
        });
    });

    res.status(200).json({
        status: 'success',
        data: {
            locations: formattedLocations
        }
    });
});

export const getDojo = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const dojo = await prisma.dojo.findUnique({
        where: { id: req.params.id },
        include: {
            instructors: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    currentBeltRank: true,
                    profilePhotoUrl: true,
                    role: true
                }
            },
            gallery: true,
            events: {
                where: {
                    startDate: {
                        gte: new Date()
                    }
                },
                orderBy: {
                    startDate: 'asc'
                }
            }
        }
    });

    if (!dojo) {
        return next(new AppError('No dojo found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            dojo,
        },
    });
});

export const createDojo = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { name, city, state, country, address, instructorId } = req.body;

    if (!city || !state || !instructorId) {
        return next(new AppError('City, State, and Primary Instructor are required', 400));
    }

    // Generate Dojo Code: First 3 letters of City (uppercase) + Sequence
    const cityCode = city.substring(0, 3).toUpperCase();
    const count = await prisma.dojo.count({
        where: {
            dojoCode: {
                startsWith: cityCode
            }
        }
    });
    const sequence = (count + 1).toString().padStart(2, '0');
    const dojoCode = `${cityCode}-${sequence}`;

    const newDojo = await prisma.dojo.create({
        data: {
            name,
            dojoCode,
            city,
            state,
            country,
            address,
            instructors: req.body.instructorId ? {
                connect: { id: req.body.instructorId }
            } : undefined
        },
    });

    res.status(201).json({
        status: 'success',
        data: {
            dojo: newDojo,
        },
    });
});

export const updateDojo = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const dojo = await prisma.dojo.update({
        where: { id: req.params.id },
        data: req.body,
    });

    if (!dojo) {
        return next(new AppError('No dojo found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            dojo,
        },
    });
});

export const deleteDojo = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    await prisma.dojo.delete({
        where: { id: req.params.id },
    });

    res.status(204).json({
        status: 'success',
        data: null,
    });
});
