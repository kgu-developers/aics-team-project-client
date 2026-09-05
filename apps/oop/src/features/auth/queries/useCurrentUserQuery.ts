import { useQuery } from '@tanstack/react-query';

import { selectHasAuthenticatedSession, useAuthStore } from '../authStore';
import { fetchSessionUser } from '../fetchSessionUser';
import { authKeys } from './authKeys';

export function useCurrentUserQuery() {
  const authenticated = useAuthStore(selectHasAuthenticatedSession);
  const role = useAuthStore(state => state.sessionRole);
  return useQuery({
    queryKey: authKeys.currentUser(),
    queryFn: () => {
      if (!role) throw new Error('사용자 역할 확인이 필요합니다.');
      return fetchSessionUser(role);
    },
    enabled: authenticated && role !== null,
    retry: false,
  });
}
