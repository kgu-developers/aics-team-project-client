import { fetchAdminSectionArtifactSummary } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { adminSectionArtifactKeys } from './adminSectionArtifactKeys';

export function useAdminSectionArtifactSummaryQuery(
  sectionId: string | undefined,
  asOf: string | undefined,
) {
  return useQuery({
    enabled: Boolean(sectionId && asOf),
    queryKey: adminSectionArtifactKeys.summary(
      sectionId ?? 'disabled',
      asOf ?? 'disabled',
    ),
    queryFn: () => {
      if (!sectionId || !asOf) throw new Error('분반과 기준일이 필요합니다.');
      return fetchAdminSectionArtifactSummary({ asOf, sectionId });
    },
  });
}
