/** Build the public URL for a result page from a site origin and result id. */
export function buildResultUrl(origin: string, id: string): string {
  if (!origin) return '';
  return `${origin.replace(/\/$/, '')}/results/${id}`;
}
