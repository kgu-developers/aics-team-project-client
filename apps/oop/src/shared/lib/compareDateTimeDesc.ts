import { seoulInstant } from './seoulInstant';

/** Sorts supported backend date-time values from newest to oldest. */
export function compareDateTimeDesc(left: string, right: string) {
  const leftInstant = seoulInstant(left);
  const rightInstant = seoulInstant(right);

  if (Number.isNaN(leftInstant) && Number.isNaN(rightInstant)) {
    return right.localeCompare(left);
  }
  if (Number.isNaN(leftInstant)) return 1;
  if (Number.isNaN(rightInstant)) return -1;

  return rightInstant - leftInstant;
}
