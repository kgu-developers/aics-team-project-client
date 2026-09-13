import { fetchAdminMidReportFeedbacks } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { adminMidReportKeys } from './adminMidReportKeys';

export function useAdminMidReportFeedbacksQuery(
  sectionId: string | undefined,
  teamId: string | undefined,
  page: number,
) {
  return useQuery({
    enabled: Boolean(sectionId && teamId),
    queryKey: adminMidReportKeys.feedbacks(sectionId ?? '', teamId ?? '', page),
    queryFn: () => {
      if (!sectionId || !teamId)
        throw new Error('분반과 팀 정보가 필요합니다.');
      return fetchAdminMidReportFeedbacks(sectionId, teamId, page);
    },
  });
}
