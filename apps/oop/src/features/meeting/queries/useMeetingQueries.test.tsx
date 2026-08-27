import { fetchMeetingRecord, fetchMeetingRecords } from '@aics/api-client';
import type { MeetingRecord } from '@aics/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useMeetingHomeSummaryQuery } from './useMeetingHomeSummaryQuery';
import { useMeetingRecordQuery } from './useMeetingRecordQuery';
import { useMeetingRecordsQuery } from './useMeetingRecordsQuery';

import { getMeetingRecords } from '~/mocks/data/meeting';

vi.mock('@aics/api-client', () => ({
  fetchMeetingRecord: vi.fn(),
  fetchMeetingRecords: vi.fn(),
}));

const fetchRecordMock = vi.mocked(fetchMeetingRecord);
const fetchRecordsMock = vi.mocked(fetchMeetingRecords);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

afterEach(() => {
  fetchRecordMock.mockReset();
  fetchRecordsMock.mockReset();
});

describe('meeting queries', () => {
  it('팀 ID가 없으면 회의록 목록 API를 호출하지 않는다', () => {
    const { result } = renderHook(() => useMeetingRecordsQuery(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(fetchRecordsMock).not.toHaveBeenCalled();
  });

  it('팀 ID가 없으면 홈 회의 요약 API를 호출하지 않는다', () => {
    const { result } = renderHook(
      () => useMeetingHomeSummaryQuery(undefined, 'student-a'),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(fetchRecordsMock).not.toHaveBeenCalled();
  });

  it('회의록 ID가 없으면 상세 API를 호출하지 않는다', () => {
    const { result } = renderHook(() => useMeetingRecordQuery(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(fetchRecordMock).not.toHaveBeenCalled();
  });

  it('팀 ID가 있으면 해당 팀의 회의록을 요청한다', async () => {
    fetchRecordsMock.mockResolvedValue([]);
    const { result } = renderHook(() => useMeetingRecordsQuery('team-07'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchRecordsMock).toHaveBeenCalledWith('team-07');
  });

  it('홈에서는 최근 회의록 3건과 내게 배정된 액션 플랜만 선택한다', async () => {
    const [baseRecord] = getMeetingRecords('team-07');
    if (!baseRecord) throw new Error('meeting fixture is required');
    const createRecord = (
      id: string,
      heldAt: string,
      assigneeUserId: string,
    ): MeetingRecord => ({
      ...baseRecord,
      id,
      heldAt,
      actions: [
        {
          ...baseRecord.actions[0]!,
          id: `action-${id}`,
          meetingId: id,
          assignee: {
            userId: assigneeUserId,
            name: `사용자 ${assigneeUserId}`,
          },
        },
      ],
    });
    fetchRecordsMock.mockResolvedValue([
      createRecord('meeting-oldest', '2026-10-01T10:00:00+09:00', 'student-c'),
      createRecord('meeting-newest', '2026-10-04T10:00:00+09:00', 'student-c'),
      createRecord('meeting-middle', '2026-10-03T10:00:00+09:00', 'student-a'),
      createRecord('meeting-second', '2026-10-02T10:00:00+09:00', 'student-c'),
    ]);

    const { result } = renderHook(
      () => useMeetingHomeSummaryQuery('team-07', 'student-c'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(
      result.current.data?.recentMeetingRecords.map(record => record.id),
    ).toEqual(['meeting-newest', 'meeting-middle', 'meeting-second']);
    expect(
      result.current.data?.assignedActions.map(action => action.id),
    ).toEqual([
      'action-meeting-newest',
      'action-meeting-second',
      'action-meeting-oldest',
    ]);
  });
});
