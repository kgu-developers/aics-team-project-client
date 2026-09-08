import type { StudentMilestoneResponse } from '@aics/core';
import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

import { useTopicMilestoneEligibility } from './useTopicMilestoneEligibility';

afterEach(() => vi.useRealTimers());
it('화면을 열어 둔 채 시작·마감 시각을 지나면 참여 상태가 바뀐다', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-01T00:00:00Z'));
  const milestones: StudentMilestoneResponse[] = [
    {
      id: 1,
      sectionId: 2,
      title: '주제 선정',
      type: 'GENERAL',
      weekNumber: 2,
      status: 'PUBLISHED',
      allowResubmissionBeforeDueAt: false,
      schedule: {
        opensAt: '2026-09-01T09:00:01',
        dueAt: '2026-09-01T09:00:02',
      },
    },
  ];
  const view = renderHook(() => useTopicMilestoneEligibility(milestones, '2'));
  expect(view.result.current.status).toBe('closed');
  act(() => vi.advanceTimersByTime(1000));
  expect(view.result.current.status).toBe('open');
  act(() => vi.advanceTimersByTime(1000));
  expect(view.result.current.status).toBe('closed');
  view.unmount();
});
