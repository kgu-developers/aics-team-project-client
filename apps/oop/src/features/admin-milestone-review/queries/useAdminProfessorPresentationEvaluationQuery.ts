import { fetchAdminProfessorPresentationEvaluation } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { adminPresentationProgressKeys } from './adminPresentationProgressKeys';

export function useAdminProfessorPresentationEvaluationQuery(
  sectionId?: string,
  milestoneId?: string,
  teamId?: string,
  enabled = true,
) {
  return useQuery({
    enabled: Boolean(enabled && sectionId && milestoneId && teamId),
    queryFn: () => {
      if (!sectionId || !milestoneId || !teamId) {
        throw new Error('교수자 평가를 조회할 식별자가 필요합니다.');
      }
      return fetchAdminProfessorPresentationEvaluation(
        sectionId,
        milestoneId,
        teamId,
      );
    },
    queryKey:
      sectionId && milestoneId && teamId
        ? adminPresentationProgressKeys.professorEvaluation(
            sectionId,
            milestoneId,
            teamId,
          )
        : ([
            ...adminPresentationProgressKeys.all,
            'professor-evaluation',
            'disabled',
          ] as const),
  });
}
