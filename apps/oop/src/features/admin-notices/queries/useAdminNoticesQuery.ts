import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '~/features/auth/authStore';

import { adminNoticeOptions } from './adminNoticeOptions';

export function useAdminNoticesQuery(sectionId: string | number | undefined) {
  const user = useAuthStore(state => state.currentUser);
  return useQuery(adminNoticeOptions(user, sectionId));
}
