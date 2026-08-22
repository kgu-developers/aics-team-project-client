import { fetchMyProfile } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '~/features/auth/authStore';

import { adminProfileKeys } from './adminProfileKeys';

export function useAdminProfileQuery() {
  const accessToken = useAuthStore(state => state.accessToken);

  return useQuery({
    queryKey: adminProfileKeys.mine(),
    queryFn: fetchMyProfile,
    enabled: Boolean(accessToken),
    retry: false,
  });
}
