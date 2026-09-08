import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../utils/errorHandler';
import { catchAsync } from '../utils/catchAsync';
import { parseDateField, parseOptionalDateField } from '../utils/parseDateField';
import { parseRank, rankTitle } from '../utils/rank';
import { resolveBio } from '../utils/delegationBio';
import { normaliseCountryCode } from '../utils/countryCodes';

/**
 * "Team India" — the squad that travels when a foreign federation invites KKFI
 * to their tournament. Each invitation is one Delegation; past trips are kept
 * as a record rather than overwritten.
 */

const memberInclude = {
    user: {
        select: {
            id: true,
            name: true,
            profilePhotoUrl: true,
            city: true,
            state: true,
            currentBeltRank: true,
            experienceYears: true,
            experienceMonths: true,
            membershipNumber: true,
            dojo: { select: { name: true, city: true } },
        },
    },
} as const;

const delegationInclude = {
    members: { include: memberInclude },
} as const;

/** Squad role ordering: the head of delegation is pinned above everyone. */
const ROLE_WEIGHT: Record<string, number> = { LEADER: 2, COACH: 1, COMPETITOR: 0 };

/**
 * Shape a delegation for clients.
 *
 * Rank is read from the frozen `rankAtSelection`, not from the user's current
 * belt — a member promoted after the trip must not retroactively change what
 * the historical page claims about them.
 */
function serializeDelegation(delegation: any) {
    const members = [...(delegation.members ?? [])]
        .map((m: any) => {
            const rank = parseRank(m.rankAtSelection);
            return {
                id: m.id,
                userId: m.userId,
                name: m.user?.name ?? 'Former member',
                profilePhotoUrl: m.user?.profilePhotoUrl ?? null,
                membershipNumber: m.user?.membershipNumber ?? null,
                dojo: m.user?.dojo?.name ?? null,
                city: m.user?.city ?? m.user?.dojo?.city ?? null,
                state: m.user?.state ?? null,
                squadRole: m.squadRole,
                sortOrder: m.sortOrder,
                rank: m.rankAtSelection,
                rankLabel: rank.label,
                rankKind: rank.kind,
                rankSortKey: rank.sortKey,
                title: rankTitle(m.rankAtSelection),
                bio: resolveBio(m.bioOverride, {
                    rankAtSelection: m.rankAtSelection,
                    dojoName: m.user?.dojo?.name,
                    city: m.user?.city ?? m.user?.dojo?.city,
                    state: m.user?.state,
                    experienceYears: m.user?.experienceYears,
                    experienceMonths: m.user?.experienceMonths,
                }),
                bioOverride: m.bioOverride ?? null,
            };
        })
        .sort((a, b) => {
            // Leader first, then most senior rank, then the admin's manual
            // ordering, then name for a stable result.
            const role = (ROLE_WEIGHT[b.squadRole] ?? 0) - (ROLE_WEIGHT[a.squadRole] ?? 0);
            if (role !== 0) return role;
            const rank = b.rankSortKey - a.rankSortKey;
            if (rank !== 0) return rank;
            if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
            return a.name.localeCompare(b.name);
        });

    return {
        id: delegation.id,
        tournamentName: delegation.tournamentName,
        hostCountry: delegation.hostCountry,
        hostCountryCode: delegation.hostCountryCode,
        hostCity: delegation.hostCity,
        startDate: delegation.startDate,
        endDate: delegation.endDate,
        summary: delegation.summary,
        coverImageUrl: delegation.coverImageUrl,
        isPublished: delegation.isPublished,
        isFeatured: delegation.isFeatured,
        memberCount: members.length,
        members,
    };
}

// ─── Public ──────────────────────────────────────────────────

/** Published delegations, most recent trip first. */
export const getPublishedDelegations = catchAsync(async (_req: Request, res: Response) => {
    const delegations = await prisma.delegation.findMany({
        where: { isPublished: true },
        include: delegationInclude,
        orderBy: { startDate: 'desc' },
    });
    res.status(200).json({
        status: 'success',
        results: delegations.length,
        data: { delegations: delegations.map(serializeDelegation) },
    });
});

/**
 * The delegation shown on the homepage strip, or null.
 *
 * Returns 200 with `delegation: null` rather than 404: "nothing is featured" is
 * a normal state, and the homepage must be able to tell it apart from a failed
 * request so it can render nothing instead of an error.
 */
export const getFeaturedDelegation = catchAsync(async (_req: Request, res: Response) => {
    const delegation = await prisma.delegation.findFirst({
        where: { isPublished: true, isFeatured: true },
        include: delegationInclude,
    });
    res.status(200).json({
        status: 'success',
        data: { delegation: delegation ? serializeDelegation(delegation) : null },
    });
});

export const getDelegationById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const delegation = await prisma.delegation.findUnique({
        where: { id: req.params.id },
        include: delegationInclude,
    });
    if (!delegation) return next(new AppError('No delegation found with that ID', 404));
    // Drafts are visible only to staff.
    const isStaff = req.user && ['ADMIN', 'INSTRUCTOR'].includes(req.user.role);
    if (!delegation.isPublished && !isStaff) {
        return next(new AppError('No delegation found with that ID', 404));
    }
    res.status(200).json({ status: 'success', data: { delegation: serializeDelegation(delegation) } });
});

// ─── Admin ───────────────────────────────────────────────────

/** Every delegation including drafts. */
export const getAllDelegations = catchAsync(async (_req: Request, res: Response) => {
    const delegations = await prisma.delegation.findMany({
        include: delegationInclude,
        orderBy: { startDate: 'desc' },
    });
    res.status(200).json({
        status: 'success',
        results: delegations.length,
        data: { delegations: delegations.map(serializeDelegation) },
    });
});

/**
 * Members who may be added to a squad.
 *
 * A profile photo is required — this page is a showcase and a card without a
 * face breaks it — so members without one are excluded here and rejected again
 * in addMember. The UI filter is a convenience; the write path is the gate.
 */
export const getEligibleMembers = catchAsync(async (req: Request, res: Response) => {
    const search = String(req.query.q ?? '').trim();
    const users = await prisma.user.findMany({
        where: {
            profilePhotoUrl: { not: null },
            ...(search
                ? {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' as const } },
                        { city: { contains: search, mode: 'insensitive' as const } },
                        { membershipNumber: { contains: search, mode: 'insensitive' as const } },
                    ],
                }
                : {}),
        },
        select: {
            id: true, name: true, role: true, profilePhotoUrl: true,
            currentBeltRank: true, city: true, state: true, membershipNumber: true,
            dojo: { select: { name: true } },
        },
        orderBy: { name: 'asc' },
        take: 100,
    });

    // Exclude anyone whose photo field exists but is blank.
    const eligible = users.filter((u) => (u.profilePhotoUrl ?? '').trim().length > 0);
    res.status(200).json({ status: 'success', results: eligible.length, data: { users: eligible } });
});

/**
 * An ISO 3166-1 alpha-2 code, or null when none was supplied.
 *
 * A value that was sent but is not a real country is an error rather than a
 * silent null: the caller believed it set a country, and the public page would
 * otherwise show a broken flag for it.
 */
function parseCountryCode(value: unknown): string | null {
    if (value === undefined || value === null || value === '') return null;
    const code = normaliseCountryCode(value);
    if (!code) throw new AppError('hostCountryCode must be a valid ISO 3166-1 alpha-2 country code', 400);
    return code;
}

export const createDelegation = catchAsync(async (req: Request, res: Response) => {
    const { tournamentName, hostCountry, hostCountryCode, hostCity, startDate, endDate, summary, coverImageUrl } = req.body;

    const start = parseDateField(startDate, 'startDate');
    const end = parseOptionalDateField(endDate, 'endDate');
    if (end && end < start) throw new AppError('endDate cannot be before startDate', 400);

    const delegation = await prisma.delegation.create({
        data: {
            tournamentName: String(tournamentName ?? '').trim(),
            hostCountry: String(hostCountry ?? '').trim(),
            // Silently dropping an unrecognised code would leave the page
            // rendering a broken flag, so reject it outright.
            hostCountryCode: parseCountryCode(hostCountryCode),
            hostCity: hostCity ? String(hostCity).trim() : null,
            startDate: start,
            endDate: end ?? null,
            summary: summary ? String(summary).trim() : null,
            coverImageUrl: coverImageUrl || null,
            createdBy: req.user.id,
        },
        include: delegationInclude,
    });
    res.status(201).json({ status: 'success', data: { delegation: serializeDelegation(delegation) } });
});

export const updateDelegation = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { tournamentName, hostCountry, hostCountryCode, hostCity, startDate, endDate, summary, coverImageUrl, isPublished } = req.body;

    const data: any = {};
    if (tournamentName !== undefined) data.tournamentName = String(tournamentName).trim();
    if (hostCountry !== undefined) data.hostCountry = String(hostCountry).trim();
    if (hostCountryCode !== undefined) data.hostCountryCode = parseCountryCode(hostCountryCode);
    if (hostCity !== undefined) data.hostCity = hostCity ? String(hostCity).trim() : null;
    if (startDate !== undefined) data.startDate = parseDateField(startDate, 'startDate');
    if (endDate !== undefined) data.endDate = parseOptionalDateField(endDate, 'endDate') ?? null;
    if (summary !== undefined) data.summary = summary ? String(summary).trim() : null;
    if (coverImageUrl !== undefined) data.coverImageUrl = coverImageUrl || null;
    if (isPublished !== undefined) data.isPublished = Boolean(isPublished);

    try {
        const delegation = await prisma.delegation.update({
            where: { id: req.params.id },
            data,
            include: delegationInclude,
        });
        // Unpublishing must also drop it off the homepage, or the strip would
        // keep rendering a delegation that is no longer public.
        if (data.isPublished === false && delegation.isFeatured) {
            await prisma.delegation.update({ where: { id: delegation.id }, data: { isFeatured: false } });
            delegation.isFeatured = false;
        }
        res.status(200).json({ status: 'success', data: { delegation: serializeDelegation(delegation) } });
    } catch (error: any) {
        if (error.code === 'P2025') return next(new AppError('No delegation found with that ID', 404));
        throw error;
    }
});

/**
 * Feature (or unfeature) a delegation on the homepage.
 *
 * At most one may be featured, so the others are cleared in the same
 * transaction — two featured rows would make the homepage's choice arbitrary.
 */
export const setFeaturedDelegation = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { isFeatured } = req.body;
    const target = await prisma.delegation.findUnique({ where: { id: req.params.id } });
    if (!target) return next(new AppError('No delegation found with that ID', 404));

    if (isFeatured === false) {
        const updated = await prisma.delegation.update({
            where: { id: target.id }, data: { isFeatured: false }, include: delegationInclude,
        });
        return res.status(200).json({ status: 'success', data: { delegation: serializeDelegation(updated) } });
    }

    if (!target.isPublished) {
        return next(new AppError('Publish this delegation before featuring it on the homepage', 400));
    }

    const [, updated] = await prisma.$transaction([
        prisma.delegation.updateMany({ where: { isFeatured: true, NOT: { id: target.id } }, data: { isFeatured: false } }),
        prisma.delegation.update({ where: { id: target.id }, data: { isFeatured: true }, include: delegationInclude }),
    ]);
    res.status(200).json({ status: 'success', data: { delegation: serializeDelegation(updated) } });
});

export const deleteDelegation = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Members cascade via the schema relation.
        await prisma.delegation.delete({ where: { id: req.params.id } });
        res.status(204).json({ status: 'success', data: null });
    } catch (error: any) {
        if (error.code === 'P2025') return next(new AppError('No delegation found with that ID', 404));
        throw error;
    }
});

// ─── Members ─────────────────────────────────────────────────

export const addDelegationMember = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { userId, squadRole, bioOverride, sortOrder } = req.body;
    if (!userId) return next(new AppError('userId is required', 400));

    const delegation = await prisma.delegation.findUnique({ where: { id: req.params.id } });
    if (!delegation) return next(new AppError('No delegation found with that ID', 404));

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, profilePhotoUrl: true, currentBeltRank: true },
    });
    if (!user) return next(new AppError('No user found with that ID', 404));

    // The showcase requires a face. Enforced here, not only in the picker.
    if (!(user.profilePhotoUrl ?? '').trim()) {
        return next(new AppError(
            `${user.name} has no profile photo. A photo is required before they can be added to Team India.`,
            400
        ));
    }

    const existing = await prisma.delegationMember.findUnique({
        where: { delegationId_userId: { delegationId: delegation.id, userId } },
    });
    if (existing) return next(new AppError(`${user.name} is already in this squad`, 400));

    if (squadRole && !['LEADER', 'COACH', 'COMPETITOR'].includes(squadRole)) {
        return next(new AppError('squadRole must be LEADER, COACH or COMPETITOR', 400));
    }

    const member = await prisma.delegationMember.create({
        data: {
            delegationId: delegation.id,
            userId,
            // Frozen now; promotion later must not rewrite history.
            rankAtSelection: user.currentBeltRank || 'White',
            squadRole: squadRole ?? 'COMPETITOR',
            bioOverride: bioOverride ? String(bioOverride).trim() : null,
            sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
        },
        include: memberInclude,
    });
    res.status(201).json({ status: 'success', data: { member } });
});

export const updateDelegationMember = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { squadRole, bioOverride, sortOrder, rankAtSelection } = req.body;

    const data: any = {};
    if (squadRole !== undefined) {
        if (!['LEADER', 'COACH', 'COMPETITOR'].includes(squadRole)) {
            return next(new AppError('squadRole must be LEADER, COACH or COMPETITOR', 400));
        }
        data.squadRole = squadRole;
    }
    if (bioOverride !== undefined) data.bioOverride = bioOverride ? String(bioOverride).trim() : null;
    if (sortOrder !== undefined) data.sortOrder = Number(sortOrder) || 0;
    // Correcting a mis-recorded rank stays possible, but it is an explicit act.
    if (rankAtSelection !== undefined) data.rankAtSelection = String(rankAtSelection).trim();

    try {
        const member = await prisma.delegationMember.update({
            where: { id: req.params.memberId }, data, include: memberInclude,
        });
        res.status(200).json({ status: 'success', data: { member } });
    } catch (error: any) {
        if (error.code === 'P2025') return next(new AppError('No squad member found with that ID', 404));
        throw error;
    }
});

export const removeDelegationMember = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    try {
        await prisma.delegationMember.delete({ where: { id: req.params.memberId } });
        res.status(204).json({ status: 'success', data: null });
    } catch (error: any) {
        if (error.code === 'P2025') return next(new AppError('No squad member found with that ID', 404));
        throw error;
    }
});
