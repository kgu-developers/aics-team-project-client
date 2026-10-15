import { fetchAdminMessages } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { compareDateTimeDesc } from '~/shared/lib/compareDateTimeDesc';
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
    select: response => ({
      ...response,
      contents: [...response.contents].sort(
        (left, right) =>
          compareDateTimeDesc(left.createdAt, right.createdAt) ||
          right.id - left.id,
      ),
    }),
  });
}
