import { fetchAdminRosterImportStatus } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { adminRosterImportStatusKeys } from './adminRosterImportStatusKeys';

export function useAdminRosterImportStatusQuery(sectionId: string | undefined) {
  return useQuery({
    enabled: Boolean(sectionId),
    queryFn: () => {
      if (!sectionId) throw new Error('분반 ID가 필요합니다.');
      return fetchAdminRosterImportStatus(sectionId);
    },
    queryKey: adminRosterImportStatusKeys.bySection(sectionId ?? 'disabled'),
  });
}
