import type { StudentMilestoneResponse } from '@aics/core';

import type { TopicParticipationEligibility } from './liveTopicBoard';

/** OOP currently identifies this GENERAL milestone by its exact display title. */
export function topicMilestoneEligibility(
  milestones: StudentMilestoneResponse[] | undefined,
  sectionId: string | undefined,
  now: number,
): TopicParticipationEligibility {
  const matches = milestones?.filter(
    item =>
      String(item.sectionId) === sectionId &&
      item.type === 'GENERAL' &&
      item.title.trim() === '주제 선정',
  );
  if (matches?.length !== 1) {
    return {
      status: 'unknown',
      reason:
        '주제 선정 마일스톤을 확인한 뒤 후보 등록과 투표를 이용할 수 있어요.',
    };
  }
  const milestone = matches[0]!;
  if (milestone.status !== 'PUBLISHED') return { status: 'closed' };
  // Server LocalDateTime schedules are in the course's Asia/Seoul timezone.
  const parse = (value?: string | null) =>
    value
      ? Date.parse(
          /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value}+09:00`,
        )
      : NaN;
  const opensAt = parse(milestone.schedule.opensAt);
  const dueAt = parse(milestone.schedule.dueAt);
  if (
    !Number.isFinite(opensAt) ||
    !Number.isFinite(dueAt) ||
    opensAt >= dueAt
  ) {
    return {
      status: 'unknown',
      reason: '주제 선정 시작·마감 일정을 확인해 주세요.',
    };
  }
  const window = { opensAt, dueAt };
  if (now < opensAt) {
    return {
      status: 'closed',
      window,
      reason: '아직 주제 선정 기간이 시작되지 않았어요.',
    };
  }
  if (now >= dueAt) {
    return {
      status: 'closed',
      window,
      reason: '주제 선정 기간이 마감되었어요.',
    };
  }
  return { status: 'open', window };
}
