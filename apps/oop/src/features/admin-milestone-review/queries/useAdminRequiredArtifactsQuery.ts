import { fetchRequiredArtifacts } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { adminRequiredArtifactKeys } from './adminRequiredArtifactKeys';

export function useAdminRequiredArtifactsQuery(
  sectionId: string | undefined,
  milestoneId: string | undefined,
) {
  return useQuery({
    enabled: Boolean(sectionId && milestoneId),
    queryFn: () => {
      if (!sectionId || !milestoneId) {
        throw new Error('분반 ID와 마일스톤 ID가 필요합니다.');
      }

      return fetchRequiredArtifacts(sectionId, milestoneId);
    },
    queryKey:
      sectionId && milestoneId
        ? adminRequiredArtifactKeys.list(sectionId, milestoneId)
        : ([...adminRequiredArtifactKeys.all, 'list', 'disabled'] as const),
  });
}
