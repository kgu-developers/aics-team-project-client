import { fetchAdminMessages } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { LIST_PAGE_SIZE } from '~/shared/lib/pagination';

import { adminMessageKeys } from './adminMessageKeys';

export function useAdminMessagesQuery(
  sectionId?: string,
  page = 0,
  teamId?: string,
) {
  return useQuery({
    queryKey: adminMessageKeys.list(sectionId, page, teamId),
    queryFn: () =>
      fetchAdminMessages({ page, sectionId, size: LIST_PAGE_SIZE, teamId }),
  });
}
