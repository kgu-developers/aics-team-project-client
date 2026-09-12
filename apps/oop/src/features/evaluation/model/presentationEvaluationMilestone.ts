import type { StudentMilestoneResponse } from '@aics/core';

function hasEvaluationWindow(milestone: StudentMilestoneResponse) {
  return Boolean(
    milestone.schedule.evaluationOpensAt &&
    milestone.schedule.evaluationClosesAt,
  );
}

function opensAtTime(milestone: StudentMilestoneResponse) {
  const parsed = Date.parse(milestone.schedule.evaluationOpensAt ?? '');
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

/**
 * 분반에 발표 마일스톤이 여럿일 수 있어 평가 창이 설정된 것만 고른다.
 * 서버 evaluation-context는 주차가 빠른 발표를 먼저 고르므로 평가 대상과 어긋날 수 있다.
 */
export function resolvePresentationEvaluationMilestone(
  milestones: StudentMilestoneResponse[] | undefined,
  now: number,
) {
  const published = (milestones ?? []).filter(
    milestone =>
      milestone.type === 'PRESENTATION' && milestone.status !== 'DRAFT',
  );
  const evaluated = published.filter(hasEvaluationWindow);
  if (!evaluated.length)
    return (
      [...published].sort(
        (left, right) =>
          left.weekNumber - right.weekNumber || left.id - right.id,
      )[0] ?? null
    );

  const ordered = [...evaluated].sort(
    (left, right) =>
      opensAtTime(left) - opensAtTime(right) || left.id - right.id,
  );
  const open = ordered.find(
    milestone =>
      opensAtTime(milestone) <= now &&
      now <= Date.parse(milestone.schedule.evaluationClosesAt ?? ''),
  );
  const upcoming = ordered.find(milestone => opensAtTime(milestone) > now);
  return open ?? upcoming ?? ordered[ordered.length - 1] ?? null;
}
