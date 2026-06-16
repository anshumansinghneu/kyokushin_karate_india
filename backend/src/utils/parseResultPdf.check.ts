import { parseResultHeader } from './parseResultPdf';

// Header text as extracted from the sample PDF's text layer.
const SAMPLE = `REG NO-828/2013
Registered by
MINISTRY OF YOUTH AFFAIRS AND SPORTS, NITI AAYOG,FIT INDIA,
Mo-9956745114
Ref No- DateDATE OF TEST 14. 06 .2026 AWARDED DATE- 16.06.2026
RESULT BELT TEST
AT- MAS OYAMA KARATE ACADEMY, KHURSIPAR
DURG CHHATTIGHAR
S.
N
NAME AGE CERTIFICAE`;

const r = parseResultHeader(SAMPLE);

function assert(cond: boolean, msg: string) {
  if (!cond) { console.error('FAIL:', msg, '=>', JSON.stringify(r)); process.exit(1); }
}

assert(!!r.testDate && r.testDate.getUTCFullYear() === 2026 && r.testDate.getUTCMonth() === 5 && r.testDate.getUTCDate() === 14, 'testDate should be 2026-06-14');
assert(!!r.awardedDate && r.awardedDate.getUTCFullYear() === 2026 && r.awardedDate.getUTCMonth() === 5 && r.awardedDate.getUTCDate() === 16, 'awardedDate should be 2026-06-16');
assert(!!r.location && /MAS OYAMA KARATE ACADEMY/i.test(r.location), 'location should contain venue');
assert(!!r.title && /Belt Test/i.test(r.title), 'title should mention Belt Test');

// Empty input must not throw and returns all-undefined.
const empty = parseResultHeader('');
assert(empty.title === undefined && empty.testDate === undefined, 'empty input yields undefined fields');

console.log('OK', JSON.stringify({ ...r, testDate: r.testDate?.toISOString(), awardedDate: r.awardedDate?.toISOString() }));
