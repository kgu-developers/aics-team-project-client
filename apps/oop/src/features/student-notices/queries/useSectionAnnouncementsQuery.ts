import { fetchSectionAnnouncements } from '@aics/api-client';
import type { SectionAnnouncement } from '@aics/core';
import { useQuery } from '@tanstack/react-query';

import { studentNoticeKeys } from './studentNoticeKeys';

export function useSectionAnnouncementsQuery(sectionId: string) {
  return useQuery<SectionAnnouncement[]>({
    enabled: Boolean(sectionId),
    queryKey: studentNoticeKeys.sectionAnnouncements(sectionId),
    queryFn: () => fetchSectionAnnouncements(sectionId),
  });
}
