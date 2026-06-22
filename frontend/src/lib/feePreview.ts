export const DEFAULT_FEE_REMINDER_TEMPLATE =
  'Osu {name}, your {month} {year} training fee of ₹{amount} for {dojoName} is due (by {dueDate}). ' +
  'Please clear it at your earliest convenience. Osu!';

export interface FeePreviewVars {
  name: string;
  amount: number | string;
  month: string;
  year: number | string;
  dojoName: string;
  dueDate: string;
}

export function renderFeePreview(template: string, vars: FeePreviewVars): string {
  const map: Record<string, string> = {
    name: String(vars.name),
    amount: String(vars.amount),
    month: String(vars.month),
    year: String(vars.year),
    dojoName: String(vars.dojoName),
    dueDate: String(vars.dueDate),
  };
  return template.replace(/\{(\w+)\}/g, (full, key) => (key in map ? map[key] : full));
}
