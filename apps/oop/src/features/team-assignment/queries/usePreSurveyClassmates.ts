import { searchPreSurveyClassmates } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { preSurveyClassmatesQueryKey } from './teamAssignmentKeys';

export function usePreSurveyClassmates(sectionId: number, keyword: string) {
  const normalizedKeyword = keyword.trim();
  return useQuery({
    enabled: normalizedKeyword.length > 0,
    queryKey: preSurveyClassmatesQueryKey(sectionId, normalizedKeyword),
    queryFn: () => searchPreSurveyClassmates(sectionId, normalizedKeyword),
    retry: false,
  });
}
