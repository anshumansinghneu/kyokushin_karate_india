export const DEFAULT_FEE_RECEIPT_TEMPLATE =
  'Osu {name}, we have recorded your {month} {year} training fee payment of ₹{amountPaid} ' +
  'for {dojoName} (method: {method}) on {date}.{pendingNote} Thank you! Osu!';

export interface FeeReceiptVars {
  name: string;
  dojoName: string;
  month: string;
  year: number | string;
  amount: number | string;
  amountPaid: number | string;
  outstanding: number;
  method: string;
  date: string;
}

export function renderFeeReceiptTemplate(template: string, vars: FeeReceiptVars): string {
  const pendingNote =
    vars.outstanding > 0 ? ` You still have ₹${vars.outstanding} pending for this month.` : '';
  const map: Record<string, string> = {
    name: String(vars.name),
    dojoName: String(vars.dojoName),
    month: String(vars.month),
    year: String(vars.year),
    amount: String(vars.amount),
    amountPaid: String(vars.amountPaid),
    outstanding: String(vars.outstanding),
    method: String(vars.method),
    date: String(vars.date),
    pendingNote,
  };
  return template.replace(/\{(\w+)\}/g, (full, key) => (key in map ? map[key] : full));
}
