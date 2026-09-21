import type { MeetingActionEntry } from '@aics/core';
import { describe, expect, it } from 'vitest';

import { homeAssignedActions } from './studentHomeSummary';

const action = (
  id: string,
  status: MeetingActionEntry['status'],
): MeetingActionEntry => ({
  id,
  meetingRecordId: 'meeting-1',
  content: `액션 ${id}`,
  status,
  assignee: { userId: '20260001', name: '학생' },
  createdAt: '2026-09-20T09:00:00+09:00',
  updatedAt: '2026-09-20T10:00:00+09:00',
  dueAt: null,
});

describe('homeAssignedActions', () => {
  it('홈 히어로에는 내 미완료 액션 플랜만 표시한다', () => {
    expect(
      homeAssignedActions(
        [
          action('todo', 'TODO'),
          action('doing', 'IN_PROGRESS'),
          action('done', 'DONE'),
        ],
        '20260001',
      ).map(item => item.id),
    ).toEqual(['todo', 'doing']);
  });
});
