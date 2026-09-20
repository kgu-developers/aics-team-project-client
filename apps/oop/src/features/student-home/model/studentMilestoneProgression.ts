import type {
  MyTeamMilestoneSubmissionResponse,
  StudentHomeMilestone,
  StudentMilestoneResponse,
} from '@aics/core';

import { milestoneTime } from './studentMilestoneSummary';

type ProgressionItem = {
  milestone: StudentMilestoneResponse;
  submission?: MyTeamMilestoneSubmissionResponse;
  summary: StudentHomeMilestone;
};

export type StudentMilestoneProgression = {
  defaultOpenId?: string;
  unlockedIds: Set<string>;
};

export function hasTerminalMilestoneCompletion({
  submission,
  summary,
}: Pick<ProgressionItem, 'submission' | 'summary'>) {
  return Boolean(
    submission?.status === 'COMPLETED' ||
    submission?.completedAt ||
    summary.status === 'completed',
  );
}

function isInScheduleWindow(
  milestone: StudentMilestoneResponse,
  submission: MyTeamMilestoneSubmissionResponse | undefined,
  now: number,
) {
  const opensAt = milestoneTime(
    milestone.schedule.evaluationOpensAt ?? milestone.schedule.opensAt,
  );
  const closesAt = milestoneTime(
    milestone.schedule.evaluationClosesAt ?? milestone.schedule.dueAt,
  );

  if (
    Number.isFinite(opensAt) &&
    Number.isFinite(closesAt) &&
    now >= opensAt &&
    now < closesAt
  ) {
    return true;
  }

  if (!submission?.canSubmitNow) return false;

  // Late submission and correction are operative schedule windows too.
  // canSubmitNow is also the only server-authoritative signal for a
  // team-specific professor reopening whose deadline is not exposed.
  const extendedUntil = milestoneTime(
    submission.status === 'REVISION_REQUESTED'
      ? milestone.schedule.revisionUntil
      : milestone.schedule.lateSubmissionUntil,
  );
  if (!Number.isFinite(closesAt) || now < closesAt) return false;
  return !Number.isFinite(extendedUntil) || now < extendedUntil;
}

/**
 * Completion unlocks the next stage. Dates only select the one initially open
 * stage; they do not unlock a stage or close an already unlocked one.
 */
export function resolveStudentMilestoneProgression(
  items: ProgressionItem[],
  now: number,
): StudentMilestoneProgression {
  const unlockedIds = new Set<string>();
  let prerequisitesCompleted = true;

  for (const item of items) {
    if (prerequisitesCompleted) unlockedIds.add(item.summary.id);
    prerequisitesCompleted =
      prerequisitesCompleted && hasTerminalMilestoneCompletion(item);
  }

  const defaultItem = items.find(
    item =>
      unlockedIds.has(item.summary.id) &&
      item.summary.isDetailAvailable &&
      !hasTerminalMilestoneCompletion(item) &&
      isInScheduleWindow(item.milestone, item.submission, now),
  );

  return { defaultOpenId: defaultItem?.summary.id, unlockedIds };
}

export function lockStudentHomeMilestone(
  milestone: StudentHomeMilestone,
): StudentHomeMilestone {
  return {
    ...milestone,
    status: 'unavailable',
    statusLabel: '이전 단계 완료 필요',
    currentStepLabel: '이전 단계를 먼저 완료해 주세요.',
    interaction: 'static',
    isDetailAvailable: false,
    body: undefined,
    rows: milestone.rows.map(row => ({
      ...row,
      actionDisabled: true,
      actionNotice: '이전 단계를 완료하면 진행할 수 있어요.',
    })),
  };
}
