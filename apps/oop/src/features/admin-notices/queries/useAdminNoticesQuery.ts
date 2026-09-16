import { fetchSectionAnnouncements } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '~/features/auth/authStore';

import { noticeSection } from '../noticeScope';
import { adminNoticeKeys } from './adminNoticeKeys';

export function useAdminNoticesQuery(sectionId: number | undefined) {
  const user = useAuthStore(state => state.currentUser);
  const section = noticeSection(user, sectionId);
  return useQuery({
    enabled: Boolean(section),
    queryKey: adminNoticeKeys.list(user?.id, sectionId),
    queryFn: () => {
      if (!section || sectionId === undefined)
        throw new Error('담당 분반을 선택해 주세요.');
      return fetchSectionAnnouncements(sectionId);
    },
  });
}
