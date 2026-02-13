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
        where
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
    // Fetch basic dojo info without relations to avoid schema mismatch issues
    const dojo = await prisma.dojo.findUnique({
        where: { id: req.params.id }
    });

    if (!dojo) {
        return next(new AppError('No dojo found with that ID', 404));
    }

    // Fetch instructors separately to avoid relation issues
    const instructors = await prisma.user.findMany({
        where: {
            dojoId: req.params.id,
            role: 'INSTRUCTOR'
        },
        select: {
            id: true,
            name: true,
            email: true,
            currentBeltRank: true,
            profilePhotoUrl: true,
            role: true
        }
    });

    // Fetch events separately with only fields that exist in production
    let events: any[] = [];
    try {
        events = await prisma.event.findMany({
            where: {
                dojoId: req.params.id,
                startDate: {
                    gte: new Date()
                }
            },
            select: {
                id: true,
                name: true,
                type: true,
                startDate: true,
                description: true
            },
            orderBy: {
                startDate: 'asc'
            }
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        // Continue without events if there's a schema issue
    }

    res.status(200).json({
        status: 'success',
        data: {
            dojo: {
                ...dojo,
                gallery: [], // Empty gallery for now until table is created
                instructors,
                events
            },
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
    const { name, city, state, country, address, contactEmail, contactPhone, latitude, longitude, instructorId } = req.body;

    // Build update data with only valid Dojo model fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (country !== undefined) updateData.country = country;
    if (address !== undefined) updateData.address = address;
    if (contactEmail !== undefined) updateData.contactEmail = contactEmail;
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;

    // Handle instructor relation separately (instructorId is not a Dojo column)
    if (instructorId) {
        updateData.instructors = { connect: { id: instructorId } };
    }

    try {
        const dojo = await prisma.dojo.update({
            where: { id: req.params.id },
            data: updateData,
        });

        res.status(200).json({
            status: 'success',
            data: {
                dojo,
            },
        });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return next(new AppError('No dojo found with that ID', 404));
        }
        throw error;
    }
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
