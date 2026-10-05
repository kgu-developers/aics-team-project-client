import { formatSeoulDateTime } from '~/shared/lib/formatSeoulDateTime';

const localDateTimePattern =
  /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(?::\d{2}(?:\.\d+)?)?$/;

/**
 * Admin meeting APIs serialize LocalDateTime as `yyyy-MM-dd HH:mm` without
 * an offset. Keep that wall-clock time intact; offset-bearing values still use
 * the shared Seoul instant formatter.
 */
export function formatAdminMeetingDateTime(value: string) {
  const match = localDateTimePattern.exec(value.trim());

  return match ? `${match[1]}/${match[2]}` : formatSeoulDateTime(value);
}
