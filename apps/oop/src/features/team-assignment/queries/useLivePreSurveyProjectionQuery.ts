import type { PreSurveyResponseDetailResponse } from '@aics/core';
import { skipToken, useQuery } from '@tanstack/react-query';

import { fetchLivePreSurveyProjection } from '../livePreSurveyProjection';
import { livePreSurveyProjectionQueryKey } from './teamAssignmentKeys';

export function useLivePreSurveyProjectionQuery(
  sectionId: number | undefined,
  surveyResponse: PreSurveyResponseDetailResponse | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: [
      ...livePreSurveyProjectionQueryKey(sectionId),
      surveyResponse?.preferredPeerUserId ?? null,
      surveyResponse?.preferredPeerStatus ?? null,
      surveyResponse?.submittedAt ?? null,
    ],
    queryFn:
      enabled && sectionId !== undefined
        ? () => fetchLivePreSurveyProjection(sectionId, surveyResponse)
        : skipToken,
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[2] === sectionId ? previous : undefined,
    retry: false,
  });
}
