import {
  fetchMyTeamAssignmentSurvey,
  submitTeamAssignmentSurvey,
} from '@aics/api-client';
import type { PreSurveyResponseDetailResponse } from '@aics/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  teamAssignmentQueryKey,
  teamAssignmentSurveyQueryKey,
} from './teamAssignmentKeys';
import { useMyTeamAssignmentSurveyQuery } from './useMyTeamAssignmentSurveyQuery';
import { useSubmitTeamAssignmentSurveyMutation } from './useSubmitTeamAssignmentSurveyMutation';

vi.mock('@aics/api-client', () => ({
  fetchMyTeamAssignmentSurvey: vi.fn(),
  submitTeamAssignmentSurvey: vi.fn(),
}));

const fetchMySurveyMock = vi.mocked(fetchMyTeamAssignmentSurvey);
const submitSurveyMock = vi.mocked(submitTeamAssignmentSurvey);

const surveyResponse: PreSurveyResponseDetailResponse = {
  id: 1,
  sectionId: 1151,
  userId: '20261001',
  preferredRoles: ['DEVELOPMENT'],
  topicOpinion: '테스트 자동화 도구',
  etcOpinion: '오후 회의를 선호합니다.',
  submittedAt: '2026-09-02 14:00',
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

describe('team assignment survey queries', () => {
  it('분반 ID로 내 사전조사 응답을 조회한다', async () => {
    fetchMySurveyMock.mockResolvedValue(surveyResponse);
    const queryClient = createQueryClient();
    const { result } = renderHook(() => useMyTeamAssignmentSurveyQuery(1151), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMySurveyMock).toHaveBeenCalledOnce();
    expect(fetchMySurveyMock).toHaveBeenCalledWith(1151);
    expect(result.current.data).toEqual(surveyResponse);
    queryClient.clear();
  });

  it('분반 ID가 없으면 사전조사 응답 API를 호출하지 않는다', () => {
    const queryClient = createQueryClient();
    const { result } = renderHook(
      () => useMyTeamAssignmentSurveyQuery(undefined),
      { wrapper: createWrapper(queryClient) },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(fetchMySurveyMock).not.toHaveBeenCalled();
    queryClient.clear();
  });

  it('분반 ID가 유효한 양의 정수가 아니면 사전조사 응답 API를 호출하지 않는다', () => {
    const queryClient = createQueryClient();
    const { result } = renderHook(
      () => useMyTeamAssignmentSurveyQuery(Number.NaN),
      { wrapper: createWrapper(queryClient) },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(fetchMySurveyMock).not.toHaveBeenCalled();
    queryClient.clear();
  });

  it('사전조사 제출 응답을 조회 캐시에 저장하고 기존 projection을 무효화한다', async () => {
    submitSurveyMock.mockResolvedValue(surveyResponse);
    const queryClient = createQueryClient();
    const projectionKey = teamAssignmentQueryKey('oop-2026-2-01');
    queryClient.setQueryData(projectionKey, { phase: 'survey' });
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(
      () => useSubmitTeamAssignmentSurveyMutation(),
      { wrapper: createWrapper(queryClient) },
    );
    const input = {
      sectionId: 1151,
      projectionSectionId: 'oop-2026-2-01',
      survey: {
        rolePreferences: ['DEVELOPMENT' as const],
        topicIdea: '테스트 자동화 도구',
        note: '오후 회의를 선호합니다.',
      },
    };

    await act(async () => {
      await result.current.mutateAsync(input);
    });

    expect(submitSurveyMock).toHaveBeenCalledOnce();
    expect(submitSurveyMock.mock.calls[0]?.[0]).toEqual({
      sectionId: input.sectionId,
      survey: input.survey,
    });
    expect(
      queryClient.getQueryData(teamAssignmentSurveyQueryKey(1151)),
    ).toEqual(surveyResponse);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: projectionKey,
    });
    expect(queryClient.getQueryState(projectionKey)?.isInvalidated).toBe(true);
    queryClient.clear();
  });
});
