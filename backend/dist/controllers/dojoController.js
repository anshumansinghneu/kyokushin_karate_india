"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDojo = exports.updateDojo = exports.createDojo = exports.getDojo = exports.getDojoLocations = exports.getAllDojos = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const errorHandler_1 = require("../utils/errorHandler");
const catchAsync_1 = require("../utils/catchAsync");
exports.getAllDojos = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { country, state } = req.query;
    const where = {};
    if (country)
        where.country = country;
    if (state)
        where.state = state;
    const dojos = await prisma_1.default.dojo.findMany({
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
exports.getDojoLocations = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const dojos = await prisma_1.default.dojo.findMany({
        select: {
            country: true,
            state: true,
            city: true
        }
    });
    // Process to get unique structure
    const locations = {};
    dojos.forEach(dojo => {
        if (!dojo.country)
            return;
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
    const formattedLocations = {};
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
exports.getDojo = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const dojo = await prisma_1.default.dojo.findUnique({
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
        return next(new errorHandler_1.AppError('No dojo found with that ID', 404));
    }
    res.status(200).json({
        status: 'success',
        data: {
            dojo,
        },
    });
});
exports.createDojo = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { name, city, state, country, address, contactEmail, contactPhone, instructorId } = req.body;
    if (!city || !state || !instructorId) {
        return next(new errorHandler_1.AppError('City, State, and Primary Instructor are required', 400));
    }
    // Generate Dojo Code: First 3 letters of City (uppercase) + Sequence
    const cityCode = city.substring(0, 3).toUpperCase();
    const count = await prisma_1.default.dojo.count({
        where: {
            dojoCode: {
                startsWith: cityCode
            }
        }
    });
    const sequence = (count + 1).toString().padStart(2, '0');
    const dojoCode = `${cityCode}-${sequence}`;
    const newDojo = await prisma_1.default.dojo.create({
        data: {
            name,
            dojoCode,
            city,
            state,
            country,
            address,
            contactEmail,
            contactPhone,
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
exports.updateDojo = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const dojo = await prisma_1.default.dojo.update({
        where: { id: req.params.id },
        data: req.body,
    });
    if (!dojo) {
        return next(new errorHandler_1.AppError('No dojo found with that ID', 404));
    }
    res.status(200).json({
        status: 'success',
        data: {
            dojo,
        },
    });
});
exports.deleteDojo = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    await prisma_1.default.dojo.delete({
        where: { id: req.params.id },
    });
    res.status(204).json({
        status: 'success',
        data: null,
    });
});
