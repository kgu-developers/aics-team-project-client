import { formatSeoulDateTime } from '~/shared/lib/formatSeoulDateTime';

export function formatRosterImportAppliedAt(value: string) {
  return formatSeoulDateTime(value);
}
