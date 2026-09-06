import { fetchAdminPreSurveyResponses } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { adminPreSurveyKeys } from './adminPreSurveyKeys';

export function useAdminPreSurveyResponsesQuery(sectionId: string | undefined) {
  return useQuery({
    enabled: Boolean(sectionId),
    queryKey: adminPreSurveyKeys.list(sectionId ?? 'disabled'),
    queryFn: () => {
      if (!sectionId) throw new Error('분반 ID가 필요합니다.');
      return fetchAdminPreSurveyResponses(sectionId);
    },
    select: response => response.contents,
  });
}
