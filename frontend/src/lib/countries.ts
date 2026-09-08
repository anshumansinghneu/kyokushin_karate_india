// Countries for Team India delegations.
//
// Host country is stored as an ISO 3166-1 alpha-2 code rather than free text,
// because a typed country name cannot reliably be matched to a flag ("Japan",
// "japan", "Japan " and "Nippon" are one country and four strings).
//
// Two separate concerns live here:
//
//  1. COUNTRIES — every country, for the admin picker. Name + code only.
//  2. THEMES    — the hero's colour pair and native name, curated for the
//                 countries KKFI realistically travels to plus the major
//                 nations. Anything not in the table still works: it gets its
//                 flag and name, and falls back to the Kyokushin palette.
//
// Colours are the two dominant hues of each flag, used only in the hero's
// colour field. Below the fold the page stays black / Kyokushin red / gold.

export interface Country {
    /** ISO 3166-1 alpha-2, uppercase. */
    code: string;
    name: string;
}

// Compact on purpose: a 250-entry array of object literals is mostly
// punctuation. Parsed once at module load.
const ISO_3166 =
    'AF:Afghanistan|AL:Albania|DZ:Algeria|AD:Andorra|AO:Angola|AG:Antigua and Barbuda|' +
    'AR:Argentina|AM:Armenia|AU:Australia|AT:Austria|AZ:Azerbaijan|BS:Bahamas|BH:Bahrain|' +
    'BD:Bangladesh|BB:Barbados|BY:Belarus|BE:Belgium|BZ:Belize|BJ:Benin|BT:Bhutan|BO:Bolivia|' +
    'BA:Bosnia and Herzegovina|BW:Botswana|BR:Brazil|BN:Brunei|BG:Bulgaria|BF:Burkina Faso|' +
    'BI:Burundi|KH:Cambodia|CM:Cameroon|CA:Canada|CV:Cape Verde|CF:Central African Republic|' +
    'TD:Chad|CL:Chile|CN:China|CO:Colombia|KM:Comoros|CG:Congo|CD:Congo (DRC)|CR:Costa Rica|' +
    'CI:Côte d’Ivoire|HR:Croatia|CU:Cuba|CY:Cyprus|CZ:Czechia|DK:Denmark|DJ:Djibouti|' +
    'DM:Dominica|DO:Dominican Republic|EC:Ecuador|EG:Egypt|SV:El Salvador|GQ:Equatorial Guinea|' +
    'ER:Eritrea|EE:Estonia|SZ:Eswatini|ET:Ethiopia|FJ:Fiji|FI:Finland|FR:France|GA:Gabon|' +
    'GM:Gambia|GE:Georgia|DE:Germany|GH:Ghana|GR:Greece|GD:Grenada|GT:Guatemala|GN:Guinea|' +
    'GW:Guinea-Bissau|GY:Guyana|HT:Haiti|HN:Honduras|HK:Hong Kong|HU:Hungary|IS:Iceland|' +
    'IN:India|ID:Indonesia|IR:Iran|IQ:Iraq|IE:Ireland|IL:Israel|IT:Italy|JM:Jamaica|JP:Japan|' +
    'JO:Jordan|KZ:Kazakhstan|KE:Kenya|KI:Kiribati|KW:Kuwait|KG:Kyrgyzstan|LA:Laos|LV:Latvia|' +
    'LB:Lebanon|LS:Lesotho|LR:Liberia|LY:Libya|LI:Liechtenstein|LT:Lithuania|LU:Luxembourg|' +
    'MO:Macao|MG:Madagascar|MW:Malawi|MY:Malaysia|MV:Maldives|ML:Mali|MT:Malta|' +
    'MH:Marshall Islands|MR:Mauritania|MU:Mauritius|MX:Mexico|FM:Micronesia|MD:Moldova|' +
    'MC:Monaco|MN:Mongolia|ME:Montenegro|MA:Morocco|MZ:Mozambique|MM:Myanmar|NA:Namibia|' +
    'NR:Nauru|NP:Nepal|NL:Netherlands|NZ:New Zealand|NI:Nicaragua|NE:Niger|NG:Nigeria|' +
    'MK:North Macedonia|KP:North Korea|NO:Norway|OM:Oman|PK:Pakistan|PW:Palau|PS:Palestine|' +
    'PA:Panama|PG:Papua New Guinea|PY:Paraguay|PE:Peru|PH:Philippines|PL:Poland|PT:Portugal|' +
    'QA:Qatar|RO:Romania|RU:Russia|RW:Rwanda|KN:Saint Kitts and Nevis|LC:Saint Lucia|' +
    'VC:Saint Vincent and the Grenadines|WS:Samoa|SM:San Marino|ST:São Tomé and Príncipe|' +
    'SA:Saudi Arabia|SN:Senegal|RS:Serbia|SC:Seychelles|SL:Sierra Leone|SG:Singapore|' +
    'SK:Slovakia|SI:Slovenia|SB:Solomon Islands|SO:Somalia|ZA:South Africa|KR:South Korea|' +
    'SS:South Sudan|ES:Spain|LK:Sri Lanka|SD:Sudan|SR:Suriname|SE:Sweden|CH:Switzerland|' +
    'SY:Syria|TW:Taiwan|TJ:Tajikistan|TZ:Tanzania|TH:Thailand|TL:Timor-Leste|TG:Togo|' +
    'TO:Tonga|TT:Trinidad and Tobago|TN:Tunisia|TR:Türkiye|TM:Turkmenistan|TV:Tuvalu|' +
    'UG:Uganda|UA:Ukraine|AE:United Arab Emirates|GB:United Kingdom|US:United States|' +
    'UY:Uruguay|UZ:Uzbekistan|VU:Vanuatu|VA:Vatican City|VE:Venezuela|VN:Vietnam|YE:Yemen|' +
    'ZM:Zambia|ZW:Zimbabwe';

export const COUNTRIES: Country[] = ISO_3166.split('|').map((entry) => {
    const i = entry.indexOf(':');
    return { code: entry.slice(0, i), name: entry.slice(i + 1) };
});

const BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]));

export interface CountryTheme {
    /** The two dominant flag hues, strongest first. */
    colors: [string, string];
    /** The country's name in its own language, when it differs usefully. */
    endonym?: string;
}

/** India's own colours — the constant half of every hero. */
export const INDIA_THEME: CountryTheme = { colors: ['#FF9933', '#138808'], endonym: 'भारत' };

/**
 * Used for any country without a curated entry. Kyokushin red and gold, so an
 * unthemed country still looks deliberate rather than broken.
 */
export const DEFAULT_THEME: CountryTheme = { colors: ['#FF0000', '#FFD700'] };

const THEMES: Record<string, CountryTheme> = {
    AE: { colors: ['#00732F', '#FF0000'], endonym: 'الإمارات' },
    AF: { colors: ['#007A36', '#CE1126'], endonym: 'افغانستان' },
    AL: { colors: ['#E41E20', '#FFFFFF'], endonym: 'Shqipëria' },
    AM: { colors: ['#D90012', '#0033A0'], endonym: 'Հայաստան' },
    AR: { colors: ['#74ACDF', '#F6B40E'] },
    AT: { colors: ['#ED2939', '#FFFFFF'], endonym: 'Österreich' },
    AU: { colors: ['#00008B', '#FF0000'] },
    AZ: { colors: ['#00B5E2', '#EF3340'], endonym: 'Azərbaycan' },
    BD: { colors: ['#006A4E', '#F42A41'], endonym: 'বাংলাদেশ' },
    BE: { colors: ['#FDDA24', '#EF3340'], endonym: 'België' },
    BG: { colors: ['#00966E', '#D62612'], endonym: 'България' },
    BH: { colors: ['#CE1126', '#FFFFFF'], endonym: 'البحرين' },
    BA: { colors: ['#002F6C', '#FECB00'], endonym: 'Bosna i Hercegovina' },
    BO: { colors: ['#D52B1E', '#007934'] },
    BR: { colors: ['#009C3B', '#FFDF00'], endonym: 'Brasil' },
    BT: { colors: ['#FFD520', '#FF4E12'], endonym: 'འབྲུག' },
    BY: { colors: ['#C8313E', '#4AA657'], endonym: 'Беларусь' },
    CA: { colors: ['#FF0000', '#FFFFFF'] },
    CH: { colors: ['#FF0000', '#FFFFFF'], endonym: 'Schweiz' },
    CL: { colors: ['#0039A6', '#D52B1E'] },
    CN: { colors: ['#EE1C25', '#FFFF00'], endonym: '中国' },
    CO: { colors: ['#FCD116', '#003893'] },
    CZ: { colors: ['#11457E', '#D7141A'], endonym: 'Česko' },
    DE: { colors: ['#DD0000', '#FFCE00'], endonym: 'Deutschland' },
    DK: { colors: ['#C8102E', '#FFFFFF'], endonym: 'Danmark' },
    DZ: { colors: ['#006233', '#D21034'], endonym: 'الجزائر' },
    EC: { colors: ['#FFDD00', '#0033A0'] },
    EE: { colors: ['#0072CE', '#FFFFFF'], endonym: 'Eesti' },
    EG: { colors: ['#CE1126', '#FFFFFF'], endonym: 'مصر' },
    ES: { colors: ['#AA151B', '#F1BF00'], endonym: 'España' },
    ET: { colors: ['#078930', '#FCDD09'] },
    FI: { colors: ['#003580', '#FFFFFF'], endonym: 'Suomi' },
    FR: { colors: ['#002395', '#ED2939'] },
    GB: { colors: ['#012169', '#C8102E'] },
    GE: { colors: ['#FF0000', '#FFFFFF'], endonym: 'საქართველო' },
    GR: { colors: ['#0D5EAF', '#FFFFFF'], endonym: 'Ελλάδα' },
    HR: { colors: ['#171796', '#FF0000'], endonym: 'Hrvatska' },
    HU: { colors: ['#477050', '#CD2A3E'], endonym: 'Magyarország' },
    ID: { colors: ['#FF0000', '#FFFFFF'] },
    IE: { colors: ['#169B62', '#FF883E'], endonym: 'Éire' },
    IL: { colors: ['#0038B8', '#FFFFFF'], endonym: 'ישראל' },
    IN: INDIA_THEME,
    IQ: { colors: ['#CE1126', '#007A3B'], endonym: 'العراق' },
    IR: { colors: ['#239F40', '#DA0000'], endonym: 'ایران' },
    IT: { colors: ['#008C45', '#CD212A'], endonym: 'Italia' },
    JO: { colors: ['#007A3D', '#CE1126'], endonym: 'الأردن' },
    JP: { colors: ['#E0002E', '#FFFFFF'], endonym: '日本' },
    KE: { colors: ['#006600', '#BB0000' ] },
    KG: { colors: ['#E8112D', '#FFEF00'], endonym: 'Кыргызстан' },
    KH: { colors: ['#032EA1', '#E00025'], endonym: 'កម្ពុជា' },
    KR: { colors: ['#003478', '#C60C30'], endonym: '대한민국' },
    KW: { colors: ['#007A3D', '#CE1126'], endonym: 'الكويت' },
    KZ: { colors: ['#00AFCA', '#FEC50C'], endonym: 'Қазақстан' },
    LA: { colors: ['#002868', '#CE1126'], endonym: 'ລາວ' },
    LB: { colors: ['#ED1C24', '#00A651'], endonym: 'لبنان' },
    LK: { colors: ['#FFB700', '#8D153A'], endonym: 'ශ්‍රී ලංකා' },
    LT: { colors: ['#FDB913', '#006A44'], endonym: 'Lietuva' },
    LV: { colors: ['#9E3039', '#FFFFFF'], endonym: 'Latvija' },
    MA: { colors: ['#C1272D', '#006233'], endonym: 'المغرب' },
    MD: { colors: ['#0046AE', '#FFD200' ] },
    ME: { colors: ['#C40308', '#D4AF3A'], endonym: 'Crna Gora' },
    MK: { colors: ['#D20000', '#FFE600'], endonym: 'Македонија' },
    MM: { colors: ['#FECB00', '#34B233'], endonym: 'မြန်မာ' },
    MN: { colors: ['#C4272F', '#0066B3'], endonym: 'Монгол' },
    MX: { colors: ['#006847', '#CE1126'], endonym: 'México' },
    MY: { colors: ['#010066', '#CC0001'] },
    NG: { colors: ['#008751', '#FFFFFF'] },
    NL: { colors: ['#AE1C28', '#21468B'], endonym: 'Nederland' },
    NO: { colors: ['#BA0C2F', '#00205B'], endonym: 'Norge' },
    NP: { colors: ['#DC143C', '#003893'], endonym: 'नेपाल' },
    NZ: { colors: ['#00247D', '#CC142B'] },
    OM: { colors: ['#DB161B', '#008000'], endonym: 'عُمان' },
    PE: { colors: ['#D91023', '#FFFFFF'], endonym: 'Perú' },
    PH: { colors: ['#0038A8', '#CE1126'] },
    PK: { colors: ['#01411C', '#FFFFFF'], endonym: 'پاکستان' },
    PL: { colors: ['#DC143C', '#FFFFFF'], endonym: 'Polska' },
    PT: { colors: ['#046A38', '#DA291C'] },
    PY: { colors: ['#D52B1E', '#0038A8'] },
    QA: { colors: ['#8A1538', '#FFFFFF'], endonym: 'قطر' },
    RO: { colors: ['#002B7F', '#FCD116'], endonym: 'România' },
    RS: { colors: ['#C6363C', '#0C4076'], endonym: 'Србија' },
    RU: { colors: ['#0039A6', '#D52B1E'], endonym: 'Россия' },
    SA: { colors: ['#006C35', '#FFFFFF'], endonym: 'السعودية' },
    SE: { colors: ['#006AA7', '#FECC00'], endonym: 'Sverige' },
    SG: { colors: ['#EF3340', '#FFFFFF'] },
    SI: { colors: ['#005DA4', '#ED1C24'], endonym: 'Slovenija' },
    SK: { colors: ['#0B4EA2', '#EE1C25'], endonym: 'Slovensko' },
    TH: { colors: ['#A51931', '#2D2A4A'], endonym: 'ไทย' },
    TJ: { colors: ['#CC0000', '#006600'], endonym: 'Тоҷикистон' },
    TM: { colors: ['#28AE66', '#CE1126'], endonym: 'Türkmenistan' },
    TN: { colors: ['#E70013', '#FFFFFF'], endonym: 'تونس' },
    TR: { colors: ['#E30A17', '#FFFFFF'], endonym: 'Türkiye' },
    TW: { colors: ['#000095', '#FE0000'], endonym: '臺灣' },
    UA: { colors: ['#0057B7', '#FFD700'], endonym: 'Україна' },
    US: { colors: ['#3C3B6E', '#B22234'] },
    UY: { colors: ['#0038A8', '#FFFFFF'] },
    UZ: { colors: ['#0099B5', '#1EB53A'], endonym: 'Oʻzbekiston' },
    VE: { colors: ['#FFCC00', '#00247D'] },
    VN: { colors: ['#DA251D', '#FFFF00'], endonym: 'Việt Nam' },
    ZA: { colors: ['#007A4D', '#FFB612'] },
};

/** Normalises whatever an admin or an old record supplied. */
function normalise(code: string | null | undefined): string {
    return (code ?? '').trim().toUpperCase();
}

/** The country for a code, or null when the code is unknown. */
export function findCountry(code: string | null | undefined): Country | null {
    return BY_CODE.get(normalise(code)) ?? null;
}

export function isCountryCode(code: string | null | undefined): boolean {
    return BY_CODE.has(normalise(code));
}

/**
 * The hero theme for a host country. Always returns something usable, so the
 * page never has to branch on "is this country themed".
 */
export function countryTheme(code: string | null | undefined): CountryTheme {
    return THEMES[normalise(code)] ?? DEFAULT_THEME;
}

/**
 * The label to show under the host flag: the native name when we have one and
 * it actually differs from the English name, otherwise the English name.
 */
export function countryLabel(code: string | null | undefined): string {
    const country = findCountry(code);
    if (!country) return '';
    const endonym = countryTheme(code).endonym;
    return endonym && endonym !== country.name ? `${country.name} · ${endonym}` : country.name;
}

/** The large ghosted word behind the hero, or '' when there is nothing apt. */
export function countryWordmark(code: string | null | undefined): string {
    const country = findCountry(code);
    if (!country) return '';
    return countryTheme(code).endonym || country.name;
}

/** Flag image URL. Width is one of flagcdn's published sizes. */
export function flagUrl(code: string | null | undefined, width: 40 | 80 | 160 | 320 | 640 = 160): string {
    return `https://flagcdn.com/w${width}/${normalise(code).toLowerCase()}.png`;
}

/** Case-insensitive substring match on the country name, for the picker. */
export function searchCountries(query: string): Country[] {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
        (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q,
    );
}
