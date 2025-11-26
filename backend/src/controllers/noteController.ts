import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../utils/errorHandler';
import { catchAsync } from '../utils/catchAsync';

// Get notes for a student
export const getStudentNotes = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const currentUser = req.user;
    const { studentId } = req.params;

    // Check if student exists
    const student = await prisma.user.findUnique({
        where: { id: studentId },
        select: { id: true, primaryInstructorId: true }
    });

    if (!student) {
        return next(new AppError('Student not found', 404));
    }

    // Authorization: Admin sees all notes, Instructor sees their students' notes (except private notes by others)
    let where: any = { studentId };

    if (currentUser.role === 'INSTRUCTOR') {
        // Instructor can only view notes for their assigned students
        if (student.primaryInstructorId !== currentUser.id) {
            return next(new AppError('You can only view notes for your assigned students', 403));
        }

        // Show public notes + their own private notes
        where.OR = [
            { isPrivate: false },
            { createdBy: currentUser.id }
        ];
    } else if (currentUser.role === 'STUDENT') {
        return next(new AppError('Students cannot view notes', 403));
    }
    // Admin sees all notes (no additional filtering)

    const notes = await prisma.studentNote.findMany({
        where,
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    role: true,
                    profilePhotoUrl: true,
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    res.status(200).json({
        status: 'success',
        results: notes.length,
        data: {
            notes
        }
    });
});

// Create a note for a student
export const createStudentNote = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const currentUser = req.user;
    const { studentId } = req.params;
    const { noteText, isPrivate } = req.body;

    if (!noteText || noteText.trim().length === 0) {
        return next(new AppError('Note text is required', 400));
    }

    // Check if student exists
    const student = await prisma.user.findUnique({
        where: { id: studentId },
        select: { id: true, primaryInstructorId: true, role: true }
    });

    if (!student) {
        return next(new AppError('Student not found', 404));
    }

    if (student.role !== 'STUDENT') {
        return next(new AppError('Notes can only be created for students', 400));
    }

    // Authorization: Only Admin and Instructor can create notes
    if (currentUser.role === 'STUDENT') {
        return next(new AppError('Students cannot create notes', 403));
    }

    // Instructor can only create notes for their assigned students
    if (currentUser.role === 'INSTRUCTOR' && student.primaryInstructorId !== currentUser.id) {
        return next(new AppError('You can only create notes for your assigned students', 403));
    }

    const note = await prisma.studentNote.create({
        data: {
            studentId,
            createdBy: currentUser.id,
            noteText: noteText.trim(),
            isPrivate: isPrivate === true, // Default to false if not specified
        },
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    role: true,
                    profilePhotoUrl: true,
                }
            }
        }
    });

    res.status(201).json({
        status: 'success',
        data: {
            note
        }
    });
});

// Update a note
export const updateStudentNote = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const currentUser = req.user;
    const { noteId } = req.params;
    const { noteText, isPrivate } = req.body;

    const note = await prisma.studentNote.findUnique({
        where: { id: noteId }
    });

    if (!note) {
        return next(new AppError('Note not found', 404));
    }

    // Only the author or admin can edit a note
    if (currentUser.role !== 'ADMIN' && note.createdBy !== currentUser.id) {
        return next(new AppError('You can only edit your own notes', 403));
    }

    const updatedNote = await prisma.studentNote.update({
        where: { id: noteId },
        data: {
            ...(noteText && { noteText: noteText.trim() }),
            ...(isPrivate !== undefined && { isPrivate }),
        },
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    role: true,
                    profilePhotoUrl: true,
                }
            }
        }
    });

    res.status(200).json({
        status: 'success',
        data: {
            note: updatedNote
        }
    });
});

// Delete a note
export const deleteStudentNote = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const currentUser = req.user;
    const { noteId } = req.params;

    const note = await prisma.studentNote.findUnique({
        where: { id: noteId }
    });

    if (!note) {
        return next(new AppError('Note not found', 404));
    }

    // Only the author or admin can delete a note
    if (currentUser.role !== 'ADMIN' && note.createdBy !== currentUser.id) {
        return next(new AppError('You can only delete your own notes', 403));
    }

    await prisma.studentNote.delete({
        where: { id: noteId }
    });

    res.status(204).json({
        status: 'success',
        data: null
    });
});

// Log profile view
export const logProfileView = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const currentUser = req.user;
    const { studentId } = req.params;

    // Don't log if user is viewing their own profile
    if (currentUser.id === studentId) {
        return res.status(200).json({
            status: 'success',
            message: 'Own profile view not logged'
        });
    }

    // Check if student exists
    const student = await prisma.user.findUnique({
        where: { id: studentId }
    });

    if (!student) {
        return next(new AppError('Student not found', 404));
    }

    await prisma.profileView.create({
        data: {
            studentId,
            viewedBy: currentUser.id
        }
    });

    res.status(201).json({
        status: 'success',
        message: 'Profile view logged'
    });
});

// Get profile views for a student
export const getProfileViews = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const currentUser = req.user;
    const { studentId } = req.params;

    // Only admins can view profile view logs
    if (currentUser.role !== 'ADMIN') {
        return next(new AppError('Only admins can view profile view logs', 403));
    }

    const views = await prisma.profileView.findMany({
        where: { studentId },
        include: {
            viewer: {
                select: {
                    id: true,
                    name: true,
                    role: true,
                    profilePhotoUrl: true,
                }
            }
        },
        orderBy: {
            viewedAt: 'desc'
        },
        take: 20 // Last 20 views
    });

    res.status(200).json({
        status: 'success',
        results: views.length,
        data: {
            views
        }
    });
});
