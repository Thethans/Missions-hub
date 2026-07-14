/** Whole-dollar USD, e.g. 3500 → "$3,500". */
export function formatMoney(n: number): string {
  return '$' + Math.round(n).toLocaleString('en-US');
}

/** First name / household name before an "&", e.g. "Jonathan & Sarah Smith" → "Jonathan". */
export function firstName(name: string): string {
  return name.split(' &')[0] ?? name;
}
