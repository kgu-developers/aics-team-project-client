import { fetchAdminMidReport } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { adminMidReportKeys } from './adminMidReportKeys';

export function useAdminMidReportQuery(
  sectionId: string | undefined,
  teamId: string | undefined,
) {
  return useQuery({
    enabled: Boolean(sectionId && teamId),
    queryKey: adminMidReportKeys.detail(sectionId ?? '', teamId ?? ''),
    queryFn: () => {
      if (!sectionId || !teamId)
        throw new Error('분반과 팀 정보가 필요합니다.');
      return fetchAdminMidReport(sectionId, teamId);
    },
  });
}
