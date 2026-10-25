import { fetchAdminMessages } from '@aics/api-client';
import { useQueries } from '@tanstack/react-query';

import { compareDateTimeDesc } from '~/shared/lib/compareDateTimeDesc';

import { adminMessageKeys } from './adminMessageKeys';

const DASHBOARD_ITEM_COUNT = 3;

export function useAdminActiveMessagesQuery(
  activeSectionIds: readonly string[],
) {
  const sectionIds = [...new Set(activeSectionIds)];
  const queries = useQueries({
    queries: sectionIds.map(sectionId => ({
      queryKey: adminMessageKeys.activeSectionSummary(sectionId),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        fetchAdminMessages(
          { page: 0, sectionId, size: DASHBOARD_ITEM_COUNT },
          { signal },
        ),
    })),
  });
  const contents = queries
    .flatMap(query => query.data?.contents ?? [])
    .sort(
      (left, right) =>
        compareDateTimeDesc(left.createdAt, right.createdAt) ||
        right.id - left.id,
    );

  return {
    data: {
      contents,
      unreadCount: queries.reduce(
        (total, query) => total + (query.data?.unreadCount ?? 0),
        0,
      ),
    },
    isError: queries.some(query => query.isError),
    isPending: queries.some(query => query.isPending),
  };
}
