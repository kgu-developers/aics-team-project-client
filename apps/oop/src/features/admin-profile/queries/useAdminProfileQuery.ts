import { fetchMyProfile } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '~/features/auth/authStore';

import { adminProfileKeys } from './adminProfileKeys';

export function useAdminProfileQuery() {
  const accessToken = useAuthStore(state => state.accessToken);
  const accountId = useAuthStore(state => state.currentUser?.studentNumber);

  return useQuery({
    queryKey: adminProfileKeys.mine(accountId ?? 'anonymous'),
    queryFn: fetchMyProfile,
    enabled: Boolean(accessToken && accountId),
    retry: false,
  });
}
