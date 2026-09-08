// ISO 3166-1 alpha-2 codes, for validating a delegation's host country.
//
// Only the codes live here, not the names: the frontend owns display names,
// flags and per-country theming (see frontend/src/lib/countries.ts). The
// backend's only job is to refuse a code it does not recognise, so a typo can
// never reach the public page and render a broken flag.

const CODES = new Set(
    ('AF AL DZ AD AO AG AR AM AU AT AZ BS BH BD BB BY BE BZ BJ BT BO BA BW BR BN BG BF BI KH ' +
        'CM CA CV CF TD CL CN CO KM CG CD CR CI HR CU CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ' +
        'ET FJ FI FR GA GM GE DE GH GR GD GT GN GW GY HT HN HK HU IS IN ID IR IQ IE IL IT JM ' +
        'JP JO KZ KE KI KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MR MU MX FM ' +
        'MD MC MN ME MA MZ MM NA NR NP NL NZ NI NE NG MK KP NO OM PK PW PS PA PG PY PE PH PL ' +
        'PT QA RO RU RW KN LC VC WS SM ST SA SN RS SC SL SG SK SI SB SO ZA KR SS ES LK SD SR ' +
        'SE CH SY TW TJ TZ TH TL TG TO TT TN TR TM TV UG UA AE GB US UY UZ VU VA VE VN YE ZM ZW')
        .split(' '),
);

/**
 * Normalises a supplied host country code, or returns null when it is not a
 * recognised country.
 *
 * Returns null for empty input too: "no country code" is a legitimate state
 * for rows created before the picker existed.
 */
export function normaliseCountryCode(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const code = value.trim().toUpperCase();
    return CODES.has(code) ? code : null;
}

/** True when the value is a recognised ISO 3166-1 alpha-2 country code. */
export function isCountryCode(value: unknown): boolean {
    return normaliseCountryCode(value) !== null;
}

export const COUNTRY_CODE_COUNT = CODES.size;
