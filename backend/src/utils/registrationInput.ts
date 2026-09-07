// Sanitising of self-service registration input.
//
// POST /api/auth/register is public and unauthenticated, so nothing in its body
// can be trusted. These helpers are deliberately pure and unit-tested, because
// the role check in particular is a security boundary: the endpoint previously
// wrote `role: req.body.role || 'STUDENT'` straight to the database, so
// {"role":"ADMIN"} minted a full administrator — who could then issue unlimited
// vouchers and bypass every membership gate.

import { AppError } from './errorHandler';

/** Roles a visitor may assign to themselves. ADMIN is intentionally absent. */
export const SELF_ASSIGNABLE_ROLES = ['STUDENT', 'INSTRUCTOR'] as const;
export type SelfAssignableRole = (typeof SELF_ASSIGNABLE_ROLES)[number];

/**
 * Resolve the role for a self-service signup, defaulting to STUDENT.
 * Throws AppError(400) for anything not explicitly self-assignable.
 */
export function resolveSelfAssignableRole(raw: unknown): SelfAssignableRole {
    const role = raw === undefined || raw === null || raw === '' ? 'STUDENT' : raw;
    if (!SELF_ASSIGNABLE_ROLES.includes(role as SelfAssignableRole)) {
        throw new AppError('Invalid role. Choose either STUDENT or INSTRUCTOR.', 400);
    }
    return role as SelfAssignableRole;
}

/**
 * The register form offers a "no dojo nearby" option whose value is the literal
 * string "fallback". Passing that to Prisma broke the foreign key insert with an
 * opaque 500, so it is normalised to "no dojo chosen".
 */
export function resolveDojoId(raw: unknown): string | undefined {
    if (typeof raw !== 'string') return undefined;
    const trimmed = raw.trim();
    if (!trimmed || trimmed === 'fallback') return undefined;
    return trimmed;
}
