import { fetchCurrentUser } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '../authStore';
import { authKeys } from './authKeys';

export function useCurrentUserQuery() {
  const accessToken = useAuthStore(state => state.accessToken);

  return useQuery({
    queryKey: authKeys.currentUser(),
    queryFn: fetchCurrentUser,
    enabled: Boolean(accessToken),
    retry: false,
  });
}
