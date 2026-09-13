import { fetchAdminPresentationEvaluationTeam } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { adminPresentationEvaluationKeys } from './adminPresentationEvaluationKeys';

export function useAdminPresentationEvaluationTeamQuery(
  sectionId: string | undefined,
  teamId: number | undefined,
  milestoneId: string | undefined,
) {
  return useQuery({
    enabled: Boolean(sectionId && teamId !== undefined),
    queryKey: [
      ...adminPresentationEvaluationKeys.all,
      'team',
      sectionId ?? 'disabled',
      teamId ?? 'disabled',
      milestoneId ?? 'auto',
    ] as const,
    queryFn: () => {
      if (!sectionId || teamId === undefined) {
        throw new Error('분반 ID와 팀 ID가 필요합니다.');
      }
      return fetchAdminPresentationEvaluationTeam(
        sectionId,
        teamId,
        milestoneId,
      );
    },
  });
}
