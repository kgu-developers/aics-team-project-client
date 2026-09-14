import { fetchSectionAnnouncements } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { adminNoticeKeys } from './adminNoticeKeys';

export function useAdminNoticeQuery(
  sectionId: string | undefined,
  noticeId: string,
) {
  return useQuery({
    enabled: Boolean(sectionId && noticeId),
    queryFn: async () => {
      if (!sectionId)
        throw new Error('공지사항 조회에는 분반 ID가 필요합니다.');
      const announcements = await fetchSectionAnnouncements(sectionId);
      return announcements.find(
        announcement => String(announcement.id) === noticeId,
      );
    },
    queryKey: adminNoticeKeys.detail(sectionId, noticeId),
  });
}
