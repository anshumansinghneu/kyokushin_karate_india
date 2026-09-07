// Formatting for DATE-ONLY values: event dates, exam dates, registration
// deadlines, birthdays, membership dates.
//
// Postgres `date`-style values arrive over the API as UTC midnight
// ("2026-05-03T00:00:00.000Z"). Reading them with local-time getters
// (`getDate()`, `toLocaleDateString()` with no timeZone) shows the PREVIOUS day
// for any viewer west of UTC — a Los Angeles visitor saw a 3 May seminar as
// "2 MAY". Every helper here pins the calendar arithmetic to UTC so the rendered
// day matches what was stored, for every viewer on earth.
//
// Do NOT use these for true timestamps (createdAt, uploadedAt, paidAt). Those are
// real instants and SHOULD render in the viewer's own timezone.

export type DateOnlyInput = string | Date | null | undefined;

const parse = (value: DateOnlyInput): Date | null => {
    if (value === null || value === undefined || value === '') return null;
    const d = value instanceof Date ? value : new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
};

export interface DateOnlyParts {
    day: number;
    /** Uppercase short month, e.g. "MAY" — for date badges. */
    month: string;
    year: number;
    /** Full human date, e.g. "3 May 2026". */
    full: string;
}

export function dateOnlyParts(value: DateOnlyInput): DateOnlyParts {
    const d = parse(value);
    if (!d) return { day: 0, month: '', year: 0, full: '' };
    return {
        day: d.getUTCDate(),
        month: new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' })
            .format(d)
            .toUpperCase(),
        year: d.getUTCFullYear(),
        full: formatDateOnly(d),
    };
}

const DEFAULT_OPTS: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
};

/**
 * e.g. "3 May 2026".
 *
 * If `options` are supplied they REPLACE the defaults rather than merging into
 * them, so `{ month: 'short', year: 'numeric' }` yields "May 2026" and not an
 * unwanted day. `timeZone` is always forced to UTC.
 */
export function formatDateOnly(
    value: DateOnlyInput,
    options?: Intl.DateTimeFormatOptions,
    locale = 'en-GB'
): string {
    const d = parse(value);
    if (!d) return '';
    const opts = options && Object.keys(options).length > 0 ? options : DEFAULT_OPTS;
    return new Intl.DateTimeFormat(locale, { ...opts, timeZone: 'UTC' }).format(d);
}

/** e.g. "3 May 2026, 3 Jun 2026" collapsed to a range: "3–5 May 2026". */
export function formatDateOnlyRange(start: DateOnlyInput, end: DateOnlyInput): string {
    const s = parse(start);
    const e = parse(end);
    if (!s) return '';
    if (!e || s.getTime() === e.getTime()) return formatDateOnly(s);

    const sameMonth =
        s.getUTCFullYear() === e.getUTCFullYear() && s.getUTCMonth() === e.getUTCMonth();
    if (sameMonth) {
        return `${s.getUTCDate()}–${formatDateOnly(e)}`;
    }
    return `${formatDateOnly(s)} – ${formatDateOnly(e)}`;
}

/** "YYYY-MM-DD" — for <input type="date"> values and date comparisons. */
export function toDateOnlyISO(value: DateOnlyInput): string {
    const d = parse(value);
    if (!d) return '';
    return d.toISOString().slice(0, 10);
}
