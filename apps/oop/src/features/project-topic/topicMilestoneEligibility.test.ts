import type { StudentMilestoneResponse } from '@aics/core';
import { describe, expect, it } from 'vitest';

import { topicMilestoneEligibility } from './topicMilestoneEligibility';

const milestone: StudentMilestoneResponse = {
  id: 1,
  sectionId: 2,
  title: '제안서',
  type: 'PROPOSAL',
  weekNumber: 2,
  status: 'PUBLISHED',
  allowResubmissionBeforeDueAt: false,
  schedule: { opensAt: '2026-09-01T09:00:00', dueAt: '2026-09-10T09:00:00' },
};
const start = Date.parse('2026-09-01T00:00:00Z');
const end = Date.parse('2026-09-10T00:00:00Z');
describe('주제 선정 마일스톤 기간', () => {
  it.each([
    [start - 1, 'closed'],
    [start, 'open'],
    [end - 1, 'open'],
    [end, 'closed'],
  ])('KST 경계 %s는 %s', (now, status) => {
    expect(
      topicMilestoneEligibility([milestone], '2', Number(now)).status,
    ).toBe(status);
  });
  it.each([
    undefined,
    [],
    [milestone, milestone],
    [{ ...milestone, sectionId: 3 }],
    [{ ...milestone, type: 'GENERAL' as const }],
  ])('미확인/중복/다른 분반·유형은 참여를 허용하지 않는다', list => {
    expect(topicMilestoneEligibility(list, '2', start).status).toBe('unknown');
  });
  it.each(['DRAFT', 'CLOSED'] as const)(
    '공개 상태 %s에서는 참여할 수 없다',
    status => {
      expect(
        topicMilestoneEligibility([{ ...milestone, status }], '2', start)
          .status,
      ).toBe('closed');
    },
  );
  it.each([
    { opensAt: null, dueAt: null },
    { opensAt: 'invalid', dueAt: 'invalid' },
    { opensAt: '2026-09-11T00:00:00Z', dueAt: '2026-09-10T00:00:00Z' },
  ])('잘못된 일정은 추정하지 않는다', schedule => {
    expect(
      topicMilestoneEligibility([{ ...milestone, schedule }], '2', start)
        .status,
    ).toBe('unknown');
  });
  it('지각 제출·재제출 기간이 주제 투표 기간을 연장하지 않는다', () => {
    expect(
      topicMilestoneEligibility(
        [
          {
            ...milestone,
            schedule: {
              ...milestone.schedule,
              revisionUntil: '2026-12-01T00:00:00Z',
            },
          },
        ],
        '2',
        end,
      ).status,
    ).toBe('closed');
  });
});
