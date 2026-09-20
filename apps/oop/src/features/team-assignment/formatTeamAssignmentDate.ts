import { formatSeoulDateTime } from '~/shared/lib/formatSeoulDateTime';

export function formatTeamAssignmentDate(isoDate?: string) {
  if (!isoDate) {
    return '안내 예정';
  }

  const formatted = formatSeoulDateTime(isoDate);
  return formatted === isoDate ? '안내 예정' : formatted;
}
