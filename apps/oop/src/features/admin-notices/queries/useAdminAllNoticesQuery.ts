import { fetchSectionAnnouncements } from '@aics/api-client';
import { useQueries } from '@tanstack/react-query';

import { adminNoticeKeys } from './adminNoticeKeys';

export function useAdminAllNoticesQuery(sectionIds: string[]) {
  const queries = useQueries({
    queries: sectionIds.map(sectionId => ({
      queryFn: () => fetchSectionAnnouncements(sectionId),
      queryKey: adminNoticeKeys.list(sectionId),
    })),
  });

  return {
    data: queries.flatMap(query => query.data ?? []),
    isError: queries.some(query => query.isError),
    isPending: queries.some(query => query.isPending),
  };
}
