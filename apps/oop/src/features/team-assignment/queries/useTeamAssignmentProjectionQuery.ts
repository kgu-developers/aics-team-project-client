import { fetchTeamAssignmentProjection } from '@aics/api-client';
import type { TeamAssignmentPhase } from '@aics/core';
import { useQuery } from '@tanstack/react-query';

import { teamAssignmentQueryKey } from './teamAssignmentKeys';

export function useTeamAssignmentProjectionQuery(
  sectionId: string | undefined,
  developmentPreview?: TeamAssignmentPhase,
) {
  return useQuery({
    enabled: Boolean(sectionId),
    queryKey: [
      ...teamAssignmentQueryKey(sectionId),
      ...(developmentPreview ? [developmentPreview] : []),
    ],
    queryFn: () =>
      fetchTeamAssignmentProjection(sectionId!, developmentPreview),
    retry: false,
  });
}
