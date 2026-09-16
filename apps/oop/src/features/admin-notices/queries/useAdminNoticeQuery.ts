import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '~/features/auth/authStore';

import { noticeId } from '../noticeScope';
import { adminNoticeKeys } from './adminNoticeKeys';
import { adminNoticeOptions } from './adminNoticeOptions';

export function useAdminNoticeQuery(
  sectionId: string | number | undefined,
  routeId: string,
) {
  const user = useAuthStore(state => state.currentUser);
  const id = noticeId(routeId);
  const scopeId = noticeId(sectionId);
  const options = adminNoticeOptions(
    user,
    id === undefined ? undefined : scopeId,
  );
  const query = useQuery({
    enabled: options.enabled,
    queryKey: adminNoticeKeys.detail(user?.id, scopeId, id),
    queryFn: async () => {
      const announcements = await options.queryFn();
      return announcements.find(announcement => announcement.id === id) ?? null;
    },
  });
  return { ...query, hasValidId: id !== undefined };
}
