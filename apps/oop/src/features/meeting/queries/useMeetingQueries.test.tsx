import {
  fetchMeetingRecord,
  fetchMeetingRecords,
  fetchTeamMeetingActions,
  submitMeetingAction,
  updateMeetingAction,
} from '@aics/api-client';
import type { MeetingRecord } from '@aics/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useMeetingHomeSummaryQuery } from './useMeetingHomeSummaryQuery';
import { useMeetingRecordQuery } from './useMeetingRecordQuery';
import { useMeetingRecordsQuery } from './useMeetingRecordsQuery';
import { useSubmitMeetingActionMutation } from './useSubmitMeetingActionMutation';
import { useTeamMeetingActionsQuery } from './useTeamMeetingActionsQuery';
import { useUpdateMeetingActionMutation } from './useUpdateMeetingActionMutation';

import { getMeetingRecords } from '~/mocks/data/meeting';

vi.mock('@aics/api-client', () => ({
  fetchMeetingRecord: vi.fn(),
  fetchMeetingRecords: vi.fn(),
  fetchTeamMeetingActions: vi.fn(),
  submitMeetingAction: vi.fn(),
  updateMeetingAction: vi.fn(),
}));

const fetchRecordMock = vi.mocked(fetchMeetingRecord);
const fetchRecordsMock = vi.mocked(fetchMeetingRecords);
const fetchActionsMock = vi.mocked(fetchTeamMeetingActions);
const submitActionMock = vi.mocked(submitMeetingAction);
const updateActionMock = vi.mocked(updateMeetingAction);

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
  fetchActionsMock.mockReset();
  submitActionMock.mockReset();
  updateActionMock.mockReset();
});

describe('meeting queries', () => {
  it('팀 ID가 없으면 회의록 목록 API를 호출하지 않는다', () => {
    const { result } = renderHook(() => useMeetingRecordsQuery(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(fetchRecordsMock).not.toHaveBeenCalled();
  });

  it('팀 ID가 없으면 액션 플랜 목록 API를 호출하지 않는다', () => {
    const { result } = renderHook(() => useTeamMeetingActionsQuery(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(fetchActionsMock).not.toHaveBeenCalled();
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

  it('팀 ID가 있으면 해당 팀의 액션 플랜을 요청한다', async () => {
    fetchActionsMock.mockResolvedValue([]);
    const { result } = renderHook(() => useTeamMeetingActionsQuery('team-07'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchActionsMock).toHaveBeenCalledWith('team-07');
  });

  it('액션 생성 후 회의록과 팀 액션 목록 캐시를 무효화한다', async () => {
    const [record] = getMeetingRecords('team-07');
    const action = record?.actions[0];
    if (!record || !action)
      throw new Error('meeting action fixture is required');
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
    submitActionMock.mockResolvedValue(action);

    const { result } = renderHook(() => useSubmitMeetingActionMutation(), {
      wrapper: ({ children }: PropsWithChildren) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    await act(async () => {
      await result.current.mutateAsync({
        input: { content: 'API 계약 정리' },
        meetingId: record.id,
        teamId: record.teamId,
      });
    });

    expect(submitActionMock).toHaveBeenCalledWith(record.id, {
      content: 'API 계약 정리',
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['meeting-records', 'actions', record.teamId],
    });
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

  it('액션 상태 변경 후 회의록과 팀 액션 목록 캐시를 모두 무효화한다', async () => {
    const [record] = getMeetingRecords('team-07');
    const action = record?.actions[0];
    if (!record || !action)
      throw new Error('meeting action fixture is required');
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
    updateActionMock.mockResolvedValue({ ...action, status: 'DONE' });

    const { result } = renderHook(() => useUpdateMeetingActionMutation(), {
      wrapper: ({ children }: PropsWithChildren) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    await act(async () => {
      await result.current.mutateAsync({
        actionId: action.id,
        input: { status: 'DONE' },
        meetingId: record.id,
        teamId: record.teamId,
      });
    });

    expect(updateActionMock).toHaveBeenCalledWith(action.id, {
      status: 'DONE',
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['meeting-records', 'detail', record.id],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['meeting-records', 'list', record.teamId],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['meeting-records', 'actions', record.teamId],
    });
  });
});
