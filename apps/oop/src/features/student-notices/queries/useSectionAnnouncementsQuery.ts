import { fetchSectionAnnouncements } from '@aics/api-client';
import type { SectionAnnouncement } from '@aics/core';
import { useQuery } from '@tanstack/react-query';

import { studentNoticeKeys } from './studentNoticeKeys';

export function useSectionAnnouncementsQuery(sectionId: number | undefined) {
  const hasSectionId =
    sectionId !== undefined && Number.isSafeInteger(sectionId) && sectionId > 0;

  return useQuery<SectionAnnouncement[]>({
    enabled: hasSectionId,
    queryKey: studentNoticeKeys.sectionAnnouncements(sectionId),
    queryFn: () => {
      if (!hasSectionId) {
        throw new Error('공지사항 조회에는 유효한 분반 ID가 필요합니다.');
      }

      return fetchSectionAnnouncements(sectionId);
    },
  });
}
