import { seoulInstant } from './seoulInstant';

const dateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/i;

/** Contact windows use the server's Asia/Seoul LocalDateTime contract. */
export function contactWindowInstant(value?: string | null): number {
  if (!value) return NaN;
  const normalized = value.trim().replace(' ', 'T');
  return dateTimePattern.test(normalized) ? seoulInstant(normalized) : NaN;
}

/** Preserve Seoul wall-clock input; normalize explicit offsets to Seoul. */
export function toContactWindowServerDateTime(value: string): string {
  const instant = contactWindowInstant(value);
  if (Number.isNaN(instant)) return value;
  return new Date(instant + 9 * 60 * 60 * 1000).toISOString().slice(0, 19);
}

/** The form and server share the same Seoul wall-clock representation. */
export function toContactWindowFormDateTime(value?: string | null): string {
  return value ? toContactWindowServerDateTime(value) : (value ?? '');
}
