import { describe, it, expect } from 'vitest';
import { resolveSelfAssignableRole, resolveDojoId, SELF_ASSIGNABLE_ROLES } from './registrationInput';

describe('resolveSelfAssignableRole', () => {
    it('defaults to STUDENT when no role is supplied', () => {
        expect(resolveSelfAssignableRole(undefined)).toBe('STUDENT');
        expect(resolveSelfAssignableRole(null)).toBe('STUDENT');
        expect(resolveSelfAssignableRole('')).toBe('STUDENT');
    });

    it('allows the two self-service roles', () => {
        expect(resolveSelfAssignableRole('STUDENT')).toBe('STUDENT');
        expect(resolveSelfAssignableRole('INSTRUCTOR')).toBe('INSTRUCTOR');
    });

    // The security regression guard. Public registration must never mint an admin.
    it('rejects ADMIN', () => {
        expect(() => resolveSelfAssignableRole('ADMIN')).toThrow(/Invalid role/);
    });

    it('never treats ADMIN as self-assignable', () => {
        expect(SELF_ASSIGNABLE_ROLES).not.toContain('ADMIN');
    });

    it('rejects unknown or malformed roles rather than defaulting them', () => {
        for (const bad of ['SUPERADMIN', 'admin', 'Student', 'root', 0, 1, true, {}, [], ['ADMIN']]) {
            expect(() => resolveSelfAssignableRole(bad as unknown), `should reject ${JSON.stringify(bad)}`)
                .toThrow(/Invalid role/);
        }
    });
});

describe('resolveDojoId', () => {
    it('passes through a real id', () => {
        expect(resolveDojoId('5ca734de-838a-4573-a9f7-4fd1205e770b'))
            .toBe('5ca734de-838a-4573-a9f7-4fd1205e770b');
    });

    it('treats the "fallback" sentinel as no dojo', () => {
        // The register form's "No dojo nearby? Register directly" option.
        expect(resolveDojoId('fallback')).toBeUndefined();
    });

    it('treats blank and non-string values as no dojo', () => {
        expect(resolveDojoId('')).toBeUndefined();
        expect(resolveDojoId('   ')).toBeUndefined();
        expect(resolveDojoId(undefined)).toBeUndefined();
        expect(resolveDojoId(null)).toBeUndefined();
        expect(resolveDojoId(123)).toBeUndefined();
    });

    it('trims surrounding whitespace', () => {
        expect(resolveDojoId('  abc  ')).toBe('abc');
    });
});
