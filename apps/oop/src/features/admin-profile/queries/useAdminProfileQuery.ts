import { fetchMyProfile } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import {
  selectHasAuthenticatedSession,
  useAuthStore,
} from '~/features/auth/authStore';

import { adminProfileKeys } from './adminProfileKeys';

export function useAdminProfileQuery() {
  const hasSession = useAuthStore(selectHasAuthenticatedSession);
  const accountId = useAuthStore(state => state.currentUser?.studentNumber);

  return useQuery({
    queryKey: adminProfileKeys.mine(accountId ?? 'anonymous'),
    queryFn: fetchMyProfile,
    enabled: Boolean(hasSession && accountId),
    retry: false,
  });
}
