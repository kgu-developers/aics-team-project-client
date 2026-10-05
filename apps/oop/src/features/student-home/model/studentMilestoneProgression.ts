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

/** Uses normalized home statuses so deadline and server-close semantics stay centralized. */
export function areAllStudentMilestonesTerminal(
  milestones: StudentHomeMilestone[],
) {
  return (
    milestones.length > 0 &&
    milestones.every(
      milestone =>
        milestone.status === 'completed' || milestone.status === 'closed',
    )
  );
}

export function hasTerminalMilestoneCompletion({
  submission,
  summary,
}: Pick<ProgressionItem, 'submission' | 'summary'>) {
  // Mid-report feedback is terminal only after the professor's final check.
  if (summary.body?.kind === 'mid-review-feedback')
    return summary.status === 'completed';
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
  const hasEvaluationWindow = Boolean(
    milestone.type === 'PRESENTATION' &&
    milestone.schedule.evaluationOpensAt &&
    milestone.schedule.evaluationClosesAt,
  );
  const opensAt = hasEvaluationWindow
    ? milestoneTime(milestone.schedule.evaluationOpensAt)
    : milestoneTime(milestone.schedule.opensAt);
  const closesAt = hasEvaluationWindow
    ? milestoneTime(milestone.schedule.evaluationClosesAt)
    : milestoneTime(milestone.schedule.dueAt);

  if (
    Number.isFinite(opensAt) &&
    Number.isFinite(closesAt) &&
    now >= opensAt &&
    now < closesAt
  ) {
    return true;
  }

  if (!submission?.canSubmitNow) return false;

  // After the shared deadline, canSubmitNow is the server-authoritative signal
  // for late submission, correction, and team-specific professor reopening.
  if (!Number.isFinite(closesAt) || now < closesAt) return false;
  return true;
}

/** Stage access follows each stage's own schedule and server submission state. */
export function resolveStudentMilestoneProgression(
  items: ProgressionItem[],
  now: number,
): StudentMilestoneProgression {
  const unlockedIds = new Set(
    items
      .filter(
        item =>
          item.submission?.canSubmitNow ||
          isInScheduleWindow(item.milestone, item.submission, now),
      )
      .map(item => item.summary.id),
  );

  const defaultItem = items.find(
    item =>
      unlockedIds.has(item.summary.id) &&
      item.summary.isDetailAvailable &&
      !hasTerminalMilestoneCompletion(item) &&
      isInScheduleWindow(item.milestone, item.submission, now),
  );

  return { defaultOpenId: defaultItem?.summary.id, unlockedIds };
}
