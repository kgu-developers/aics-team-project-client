import type { AdminSectionMilestoneDto } from '@aics/api-client';

import { seoulInstant } from '~/shared/lib/seoulInstant';

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const SEOUL_OFFSET_IN_MS = 9 * 60 * 60 * 1000;

function getSeoulDayNumber(timestamp: number) {
  const seoulDate = new Date(timestamp + SEOUL_OFFSET_IN_MS);

  return (
    Date.UTC(
      seoulDate.getUTCFullYear(),
      seoulDate.getUTCMonth(),
      seoulDate.getUTCDate(),
    ) / DAY_IN_MS
  );
}

function getAdminHomeScheduleDateParts(value: string | null | undefined) {
  const timestamp = seoulInstant(value);

  if (Number.isNaN(timestamp)) return null;

  const seoulDate = new Date(timestamp + SEOUL_OFFSET_IN_MS);

  return {
    day: String(seoulDate.getUTCDate()).padStart(2, '0'),
    hour: String(seoulDate.getUTCHours()).padStart(2, '0'),
    minute: String(seoulDate.getUTCMinutes()).padStart(2, '0'),
    month: String(seoulDate.getUTCMonth() + 1).padStart(2, '0'),
  };
}

function compareMilestoneOrder(
  left: AdminSectionMilestoneDto,
  right: AdminSectionMilestoneDto,
) {
  return left.weekNumber - right.weekNumber || left.id - right.id;
}

function isPresentationEvaluationOnlyMilestone(
  milestone: AdminSectionMilestoneDto,
) {
  if (
    milestone.type !== 'PRESENTATION' ||
    !milestone.schedule.dueAt ||
    !milestone.schedule.evaluationClosesAt
  ) {
    return false;
  }

  const dueAt = seoulInstant(milestone.schedule.dueAt);
  const evaluationClosesAt = seoulInstant(
    milestone.schedule.evaluationClosesAt,
  );

  return (
    !Number.isNaN(dueAt) &&
    !Number.isNaN(evaluationClosesAt) &&
    dueAt === evaluationClosesAt
  );
}

export function getAdminHomeDeadlineLabel(
  dueAt: string | null | undefined,
  now = Date.now(),
) {
  const dueTimestamp = seoulInstant(dueAt);

  if (Number.isNaN(dueTimestamp)) return '일정 미정';
  if (dueTimestamp <= now) return '마감';

  const remainingDays =
    getSeoulDayNumber(dueTimestamp) - getSeoulDayNumber(now);

  return remainingDays === 0 ? '오늘 마감' : `D-${remainingDays}`;
}

export function formatAdminHomeScheduleDate(dueAt: string | null | undefined) {
  const date = getAdminHomeScheduleDateParts(dueAt);

  if (!date) return '마감일 미정';

  return `~ ${date.month}.${date.day} ${date.hour}:${date.minute}`;
}

export function getAdminHomePresentationEvaluationState({
  endsAt,
  milestoneStatus,
  now = Date.now(),
  startsAt,
}: {
  endsAt: string | null | undefined;
  milestoneStatus: AdminSectionMilestoneDto['status'];
  now?: number;
  startsAt: string | null | undefined;
}) {
  const startsAtInstant = seoulInstant(startsAt);
  const endsAtInstant = seoulInstant(endsAt);
  if (
    Number.isNaN(startsAtInstant) ||
    Number.isNaN(endsAtInstant) ||
    startsAtInstant >= endsAtInstant
  ) {
    return '기간 미정';
  }
  if (milestoneStatus === 'CLOSED' || now >= endsAtInstant) return '종료';
  if (milestoneStatus !== 'PUBLISHED' || now < startsAtInstant)
    return '시작 전';

  return '진행 중';
}

/**
 * The server list already excludes deleted milestones. Status is intentionally not
 * filtered: draft, published, and closed milestones all remain visible on the home.
 * A legacy presentation-evaluation-only milestone mirrors its close time into
 * `dueAt`; the home schedule only presents the material-submission deadline.
 */
export function getAdminHomeMilestones(
  milestones: readonly AdminSectionMilestoneDto[],
) {
  return milestones
    .filter(milestone => !isPresentationEvaluationOnlyMilestone(milestone))
    .sort(compareMilestoneOrder);
}

export function getAdminHomeScheduleRefreshAt(
  dueAts: readonly (string | null | undefined)[],
  now = Date.now(),
) {
  const seoulNow = new Date(now + SEOUL_OFFSET_IN_MS);
  const nextSeoulMidnight =
    Date.UTC(
      seoulNow.getUTCFullYear(),
      seoulNow.getUTCMonth(),
      seoulNow.getUTCDate() + 1,
    ) - SEOUL_OFFSET_IN_MS;
  const nextDeadline = dueAts
    .map(seoulInstant)
    .filter(timestamp => !Number.isNaN(timestamp) && timestamp > now)
    .sort((left, right) => left - right)[0];

  return nextDeadline === undefined
    ? nextSeoulMidnight
    : Math.min(nextSeoulMidnight, nextDeadline);
}
