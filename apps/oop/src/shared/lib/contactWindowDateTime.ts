import { seoulInstant } from './seoulInstant';

const offsetlessDateTimePattern =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/i;
const explicitZonePattern = /(?:Z|[+-]\d{2}:?\d{2})$/i;

/**
 * Contact windows are persisted as backend LocalDateTime values and compared
 * against the API server's UTC clock. Treat zone-less responses as UTC so the
 * client opens the window at the same instant as the contact endpoint.
 */
export function contactWindowInstant(value?: string | null): number {
  if (!value) return NaN;
  const normalized = value.trim().replace(' ', 'T');

  if (explicitZonePattern.test(normalized)) return Date.parse(normalized);
  if (!offsetlessDateTimePattern.test(normalized)) return NaN;

  return Date.parse(`${normalized}Z`);
}

/** Converts a Seoul wall-clock form value to the UTC LocalDateTime contract. */
export function toContactWindowServerDateTime(value: string): string {
  const instant = seoulInstant(value);
  if (Number.isNaN(instant)) return value;
  return new Date(instant).toISOString().slice(0, 19);
}

/** Converts a persisted contact window to a Seoul wall-clock form value. */
export function toContactWindowFormDateTime(value?: string | null): string {
  const instant = contactWindowInstant(value);
  if (Number.isNaN(instant)) return value ?? '';

  // Asia/Seoul has no daylight-saving transitions, so a fixed offset keeps
  // the native date/time controls independent of the browser host timezone.
  return new Date(instant + 9 * 60 * 60 * 1000).toISOString().slice(0, 19);
}
