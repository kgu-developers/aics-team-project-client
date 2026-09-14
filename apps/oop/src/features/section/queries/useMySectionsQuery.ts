import { fetchMySections } from '@aics/api-client';
import type { FetchMySectionsFilter } from '@aics/core';
import { useQuery } from '@tanstack/react-query';

import {
  selectHasAuthenticatedSession,
  useAuthStore,
} from '~/features/auth/authStore';

import { sectionKeys } from './sectionKeys';

export function useMySectionsQuery(
  filter: FetchMySectionsFilter = {},
  enabled = true,
) {
  const hasAuthenticatedSession = useAuthStore(selectHasAuthenticatedSession);

  return useQuery({
    enabled: enabled && hasAuthenticatedSession,
    retry: false,
    queryFn: () => fetchMySections(filter),
    queryKey: sectionKeys.mySections(filter),
  });
}
