import prisma from '../prisma';

/**
 * Whether an instructor works at a dojo: their home dojo, or one they are linked to as a
 * teacher. Many instructors have only the second, so checks on `user.dojoId` alone
 * locked them out of their own dojo's fees and their students' belt history.
 */
export async function teachesAt(user: { id: string; dojoId?: string | null }, dojoId: string | null | undefined): Promise<boolean> {
    if (!dojoId) return false;
    if (user.dojoId === dojoId) return true;
    const link = await prisma.dojo.count({ where: { id: dojoId, instructors: { some: { id: user.id } } } });
    return link > 0;
}
