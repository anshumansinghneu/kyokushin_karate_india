export interface ParsedResultHeader {
  title?: string;
  testDate?: Date;
  awardedDate?: Date;
  location?: string;
}

// Parse a "DD. MM .YYYY" or "DD.MM.YYYY" style date (spaces optional) into a UTC Date.
function parseDmy(raw: string): Date | undefined {
  const m = raw.match(/(\d{1,2})\s*\.\s*(\d{1,2})\s*\.\s*(\d{4})/);
  if (!m) return undefined;
  const day = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  const year = parseInt(m[3], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined;
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Best-effort extraction of header metadata from the PDF's text layer.
 * Never throws; absent fields are left undefined.
 */
export function parseResultHeader(text: string): ParsedResultHeader {
  const out: ParsedResultHeader = {};
  if (!text) return out;

  const flat = text.replace(/\s+/g, ' ');

  // DATE OF TEST 14. 06 .2026
  const testMatch = flat.match(/DATE OF TEST\s*([\d.\s]+\d{4})/i);
  if (testMatch) out.testDate = parseDmy(testMatch[1]);

  // AWARDED DATE- 16.06.2026
  const awardMatch = flat.match(/AWARDED DATE-?\s*([\d.\s]+\d{4})/i);
  if (awardMatch) out.awardedDate = parseDmy(awardMatch[1]);

  // AT- <venue>  (stop at the column-header row that starts with "S." / "NAME")
  const atMatch = flat.match(/AT-\s*(.+?)(?:\s+S\.\s*N\b|\s+NAME\b|$)/i);
  if (atMatch) {
    out.location = atMatch[1].replace(/\s+/g, ' ').trim();
  }

  // Title: prefer a venue-based title, else fall back to "Belt Test Result".
  if (out.location) {
    out.title = `Belt Test — ${out.location}`;
  } else if (/RESULT BELT TEST/i.test(flat)) {
    out.title = 'Belt Test Result';
  }

  return out;
}
