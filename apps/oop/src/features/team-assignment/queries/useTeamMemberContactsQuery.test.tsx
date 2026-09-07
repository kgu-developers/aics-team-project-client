import {
  claimTeamLeader,
  fetchTeamKickoff,
  fetchTeamMemberContacts,
} from '@aics/api-client';
import type {
  TeamKickoffResponse,
  TeamMemberContactListResponse,
} from '@aics/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { authKeys } from '~/features/auth/queries/authKeys';

import {
  teamKickoffQueryKey,
  teamMemberContactsQueryKey,
} from './teamAssignmentKeys';
import { useClaimTeamLeaderMutation } from './useClaimTeamLeaderMutation';
import { useTeamKickoffQuery } from './useTeamKickoffQuery';
import {
  isValidPositiveTeamId,
  useTeamMemberContactsQuery,
} from './useTeamMemberContactsQuery';

vi.mock('@aics/api-client', () => ({
  claimTeamLeader: vi.fn(),
  fetchTeamKickoff: vi.fn(),
  fetchTeamMemberContacts: vi.fn(),
}));

vi.mock('@aics/design-system', () => ({
  useToast: () => vi.fn(),
}));

const fetchContactsMock = vi.mocked(fetchTeamMemberContacts);
const fetchKickoffMock = vi.mocked(fetchTeamKickoff);
const claimLeaderMock = vi.mocked(claimTeamLeader);

const contacts: TeamMemberContactListResponse['contents'] = [
  {
    studentNumber: '20261002',
    name: '윤 새봄',
    phone: '010-2026-1002',
    isLeader: false,
  },
];

const kickoff: TeamKickoffResponse = {
  id: 4,
  name: '7조',
  members: [
    {
      id: 10,
      studentNumber: '20261002',
      name: '윤 새봄',
      isLeader: false,
    },
  ],
};

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

afterEach(() => {
  vi.resetAllMocks();
});

describe('team member contacts query', () => {
  it('양의 정수 팀 ID로 킥오프 정보를 조회한다', async () => {
    fetchKickoffMock.mockResolvedValue(kickoff);
    const queryClient = createQueryClient();
    const { result } = renderHook(() => useTeamKickoffQuery('4'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchKickoffMock).toHaveBeenCalledWith('4');
    expect(result.current.data).toEqual(kickoff);
    queryClient.clear();
  });

  it.each([undefined, '9007199254740993'])(
    '팀 ID가 없거나 안전 정수 범위를 벗어나면(%s) 킥오프 API를 호출하지 않는다',
    teamId => {
      const queryClient = createQueryClient();
      const { result } = renderHook(() => useTeamKickoffQuery(teamId), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(fetchKickoffMock).not.toHaveBeenCalled();
      queryClient.clear();
    },
  );

  it('양의 정수 팀 ID로 연락처 envelope를 조회한다', async () => {
    fetchContactsMock.mockResolvedValue(contacts);
    const queryClient = createQueryClient();
    const { result, unmount } = renderHook(
      () => useTeamMemberContactsQuery('4'),
      {
        wrapper: createWrapper(queryClient),
      },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchContactsMock).toHaveBeenCalledOnce();
    expect(fetchContactsMock).toHaveBeenCalledWith('4');
    expect(result.current.data).toEqual(contacts);

    unmount();
    await waitFor(() =>
      expect(
        queryClient.getQueryData(teamMemberContactsQueryKey('4')),
      ).toBeUndefined(),
    );
    queryClient.clear();
  });

  it.each([
    undefined,
    '',
    '0',
    '-1',
    '4.2',
    'synthetic-team-4',
    '9007199254740993',
  ])('유효하지 않은 팀 ID(%s)에서는 연락처 API를 호출하지 않는다', teamId => {
    const queryClient = createQueryClient();
    const { result } = renderHook(() => useTeamMemberContactsQuery(teamId), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(fetchContactsMock).not.toHaveBeenCalled();
    queryClient.clear();
  });

  it('팀 ID 선행조건 판별은 양의 안전 정수 문자열만 허용한다', () => {
    expect(isValidPositiveTeamId('1')).toBe(true);
    expect(isValidPositiveTeamId('9007199254740991')).toBe(true);
    expect(isValidPositiveTeamId('9007199254740992')).toBe(false);
    expect(isValidPositiveTeamId('9007199254740993')).toBe(false);
    expect(isValidPositiveTeamId('9223372036854775807')).toBe(false);
    expect(isValidPositiveTeamId('0')).toBe(false);
    expect(isValidPositiveTeamId('9223372036854775808')).toBe(false);
    expect(isValidPositiveTeamId('team-1')).toBe(false);
  });

  it('연락처 공개가 끝나면 기존 데이터가 사라지고 재조회하지 않는다', async () => {
    fetchContactsMock.mockResolvedValue(contacts);
    const queryClient = createQueryClient();
    const { result, rerender } = renderHook(
      ({ enabled }) => useTeamMemberContactsQuery('4', enabled),
      { wrapper: createWrapper(queryClient), initialProps: { enabled: true } },
    );
    await waitFor(() => expect(result.current.data).toEqual(contacts));
    rerender({ enabled: false });
    expect(result.current.data).toBeUndefined();
    expect(result.current.fetchStatus).toBe('idle');
    await waitFor(() =>
      expect(
        queryClient.getQueryData(teamMemberContactsQueryKey('4')),
      ).toBeUndefined(),
    );
    expect(fetchContactsMock).toHaveBeenCalledOnce();
    queryClient.clear();
  });

  it('팀장 선점 성공 뒤 사용자와 kickoff 상태를 무효화한다', async () => {
    claimLeaderMock.mockResolvedValue(undefined);
    const queryClient = createQueryClient();
    const projectionKey = authKeys.currentUser();
    queryClient.setQueryData(projectionKey, { phase: 'firstMeeting' });
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useClaimTeamLeaderMutation(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        input: { teamId: '4' },
      });
    });

    expect(claimLeaderMock).toHaveBeenCalledWith({ teamId: '4' });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: projectionKey,
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: teamKickoffQueryKey('4'),
    });
    expect(queryClient.getQueryState(projectionKey)?.isInvalidated).toBe(true);
    queryClient.clear();
  });
  it('팀장 선점 409는 실패를 유지하며 이미 선점된 팀 상태를 재조회한다', async () => {
    const error = { isAxiosError: true, response: { status: 409 } };
    claimLeaderMock.mockRejectedValue(error);
    const queryClient = createQueryClient();
    queryClient.setQueryData(teamKickoffQueryKey('4'), kickoff);
    queryClient.setQueryData(authKeys.currentUser(), { teamId: '4' });
    const { result } = renderHook(() => useClaimTeamLeaderMutation(), {
      wrapper: createWrapper(queryClient),
    });
    await act(async () => {
      await expect(
        result.current.mutateAsync({ input: { teamId: '4' } }),
      ).rejects.toEqual(error);
    });
    expect(
      queryClient.getQueryState(teamKickoffQueryKey('4'))?.isInvalidated,
    ).toBe(true);
    expect(
      queryClient.getQueryState(authKeys.currentUser())?.isInvalidated,
    ).toBe(true);
    queryClient.clear();
  });

  it('유효한 팀 ID가 없으면 팀장 선점을 요청하지 않는다', async () => {
    const queryClient = createQueryClient();
    const { result } = renderHook(() => useClaimTeamLeaderMutation(), {
      wrapper: createWrapper(queryClient),
    });
    await act(async () => {
      await expect(
        result.current.mutateAsync({ input: { teamId: '' } }),
      ).rejects.toThrow('팀 ID');
    });
    expect(claimLeaderMock).not.toHaveBeenCalled();
    queryClient.clear();
  });
});
