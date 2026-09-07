import { fetchMyTeamAssignmentSurvey } from '@aics/api-client';
import { skipToken, useQuery } from '@tanstack/react-query';

import { teamAssignmentSurveyQueryKey } from './teamAssignmentKeys';

function validSectionId(sectionId?: number) {
  return typeof sectionId === 'number' &&
    Number.isSafeInteger(sectionId) &&
    sectionId > 0
    ? sectionId
    : undefined;
}

export function useMyTeamAssignmentSurveyQuery(sectionId?: number) {
  const sectionIdForRequest = validSectionId(sectionId);

  return useQuery({
    queryKey: teamAssignmentSurveyQueryKey(sectionId),
    queryFn:
      sectionIdForRequest === undefined
        ? skipToken
        : () => fetchMyTeamAssignmentSurvey(sectionIdForRequest),
    retry: false,
  });
}
