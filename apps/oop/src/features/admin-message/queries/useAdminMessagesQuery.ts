import { fetchAdminMessages } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { adminMessageKeys } from './adminMessageKeys';

export function useAdminMessagesQuery(
  sectionId?: string,
  page = 0,
  teamId?: string,
) {
  return useQuery({
    queryKey: adminMessageKeys.list(sectionId, page, teamId),
    queryFn: () =>
      fetchAdminMessages({ page, sectionId, size: 100, teamId }),
  });
}
