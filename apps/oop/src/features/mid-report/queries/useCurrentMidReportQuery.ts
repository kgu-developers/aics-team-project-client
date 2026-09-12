import { fetchCurrentMidReport } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import {
  selectHasAuthenticatedSession,
  useAuthStore,
} from '~/features/auth/authStore';

import { midReportKeys } from './midReportKeys';

export function useCurrentMidReportQuery(enabled: boolean) {
  const session = useAuthStore();
  return useQuery({
    enabled:
      enabled &&
      selectHasAuthenticatedSession(session) &&
      session.currentUser?.globalRole === 'STUDENT',
    retry: false,
    refetchOnWindowFocus: false,
    queryKey: midReportKeys.current(session),
    queryFn: fetchCurrentMidReport,
  });
}
