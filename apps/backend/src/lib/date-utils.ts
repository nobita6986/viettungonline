import { parseDateVN } from './formatters';

export function parseDateSafe(d: Date | string | undefined | null): Date | null {
  if (!d) return null;
  if (d instanceof Date) return d;
  return parseDateVN(d) || null;
}
