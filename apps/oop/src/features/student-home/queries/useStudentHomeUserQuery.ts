import { fetchCurrentUser } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import {
  selectHasAuthenticatedSession,
  useAuthStore,
} from '~/features/auth/authStore';

import { studentHomeKeys } from './studentHomeKeys';

/** Keep the documented /me identity separate from legacy demo presentation data. */
export function useStudentHomeUserQuery() {
  const authenticated = useAuthStore(selectHasAuthenticatedSession);
  const role = useAuthStore(state => state.sessionRole);
  const studentNumber = useAuthStore(state => state.currentUser?.studentNumber);

  return useQuery({
    queryKey: studentHomeKeys.user(studentNumber, role),
    queryFn: () => fetchCurrentUser('STUDENT'),
    enabled: authenticated && role === 'STUDENT',
    retry: false,
  });
}
