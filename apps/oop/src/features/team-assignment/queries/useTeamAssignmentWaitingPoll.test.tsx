import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useStudentHomeUserQuery } from '~/features/student-home/queries/useStudentHomeUserQuery';

import {
  TEAM_ASSIGNMENT_WAITING_POLL_INTERVAL_MS,
  useTeamAssignmentWaitingPoll,
} from './useTeamAssignmentWaitingPoll';

vi.mock('~/features/student-home/queries/useStudentHomeUserQuery', () => ({
  useStudentHomeUserQuery: vi.fn(),
}));

const useStudentHomeUserQueryMock = vi.mocked(useStudentHomeUserQuery);

beforeEach(() => {
  useStudentHomeUserQueryMock.mockReset();
});

describe('useTeamAssignmentWaitingPoll', () => {
  it('배정 대기 중에만 /me query를 주기적으로 갱신한다', () => {
    const { rerender } = renderHook(
      ({ waiting }) => useTeamAssignmentWaitingPoll(waiting),
      { initialProps: { waiting: true } },
    );

    expect(useStudentHomeUserQueryMock).toHaveBeenLastCalledWith(true, {
      refetchInterval: TEAM_ASSIGNMENT_WAITING_POLL_INTERVAL_MS,
    });

    rerender({ waiting: false });

    expect(useStudentHomeUserQueryMock).toHaveBeenLastCalledWith(false, {
      refetchInterval: false,
    });
  });
});
