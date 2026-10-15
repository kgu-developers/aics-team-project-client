import { fetchSectionAnnouncements } from '@aics/api-client';
import type { CurrentUser } from '@aics/core';

import { seoulInstant } from '~/shared/lib/seoulInstant';

import { noticeId, noticeSection } from '../noticeScope';
import { adminNoticeKeys } from './adminNoticeKeys';

function publishedTime(value: string) {
  const timestamp = seoulInstant(value);
  return Number.isNaN(timestamp) ? -Infinity : timestamp;
}

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
      return announcements
        .filter(announcement => announcement.sectionId === sectionId)
        .sort(
          (left, right) =>
            publishedTime(right.publishedAt) - publishedTime(left.publishedAt),
        );
    },
  };
}
