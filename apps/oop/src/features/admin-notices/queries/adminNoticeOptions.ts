import { fetchSectionAnnouncements } from '@aics/api-client';
import type { CurrentUser } from '@aics/core';

import { noticeId, noticeSection } from '../noticeScope';
import { adminNoticeKeys } from './adminNoticeKeys';

export function adminNoticeOptions(
  user: CurrentUser | null,
  value: string | number | undefined,
) {
  const sectionId = noticeId(value);
  const section = noticeSection(user, sectionId);
  return {
    enabled: Boolean(section),
    queryKey: adminNoticeKeys.list(user?.id, sectionId),
    queryFn: async () => {
      if (!section || sectionId === undefined)
        throw new Error('담당 분반을 선택해 주세요.');
      const announcements = await fetchSectionAnnouncements(sectionId);
      return announcements.filter(
        announcement => announcement.sectionId === sectionId,
      );
    },
  };
}
