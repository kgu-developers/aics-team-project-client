import {
  fetchAdminMessages,
  type AdminMessageSortDirection,
} from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { LIST_PAGE_SIZE } from '~/shared/lib/pagination';

import { adminMessageKeys } from './adminMessageKeys';

export function useAdminMessagesQuery(
  sectionId?: string,
  page = 0,
  teamId?: string,
  senderKeyword?: string,
  sort: AdminMessageSortDirection = 'DESC',
) {
  return useQuery({
    queryKey: adminMessageKeys.list(
      sectionId,
      page,
      teamId,
      senderKeyword,
      sort,
    ),
    queryFn: () =>
      fetchAdminMessages({
        page,
        sectionId,
        senderKeyword: senderKeyword?.trim() || undefined,
        size: LIST_PAGE_SIZE,
        sort,
        teamId,
      }),
  });
}
