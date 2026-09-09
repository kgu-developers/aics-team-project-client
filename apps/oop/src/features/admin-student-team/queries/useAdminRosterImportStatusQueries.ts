import { fetchAdminRosterImportStatus } from '@aics/api-client';
import { useQueries } from '@tanstack/react-query';

import { adminRosterImportStatusKeys } from './adminRosterImportStatusKeys';

export function useAdminRosterImportStatusQueries(
  sectionIds: readonly string[],
) {
  const uniqueSectionIds = [...new Set(sectionIds.filter(Boolean))];
  const queries = useQueries({
    queries: uniqueSectionIds.map(sectionId => ({
      queryFn: () => fetchAdminRosterImportStatus(sectionId),
      queryKey: adminRosterImportStatusKeys.bySection(sectionId),
    })),
  });

  return uniqueSectionIds.map((sectionId, index) => ({
    query: queries[index],
    sectionId,
  }));
}
