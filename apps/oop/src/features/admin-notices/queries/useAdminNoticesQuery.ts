import { fetchSectionAnnouncements } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { adminNoticeKeys } from './adminNoticeKeys';

export function useAdminNoticesQuery(sectionId: string | undefined) {
  return useQuery({
    enabled: Boolean(sectionId),
    queryFn: () => {
      if (!sectionId)
        throw new Error('공지사항 조회에는 분반 ID가 필요합니다.');
      return fetchSectionAnnouncements(sectionId);
    },
    queryKey: adminNoticeKeys.list(sectionId),
  });
}
