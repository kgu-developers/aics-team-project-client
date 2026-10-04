import { fetchAdminProfessorPresentationEvaluation } from '@aics/api-client';
import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';

import { adminPresentationProgressKeys } from './adminPresentationProgressKeys';

type PresentationTeam = {
  presentationOrder: number | null;
  teamId: number;
  teamName: string;
};

export function useAdminProfessorPresentationEvaluationStatusesQuery(
  sectionId: string,
  milestoneId: string,
  teams: readonly PresentationTeam[],
  enabled: boolean,
) {
  const queries = useQueries({
    queries: teams.map(team => ({
      enabled,
      queryFn: () =>
        fetchAdminProfessorPresentationEvaluation(
          sectionId,
          milestoneId,
          String(team.teamId),
        ),
      queryKey: adminPresentationProgressKeys.professorEvaluation(
        sectionId,
        milestoneId,
        String(team.teamId),
      ),
      staleTime: 0,
    })),
  });

  return useMemo(
    () => ({
      data: teams.map((team, index) => ({
        ...team,
        submittedAt: queries[index]?.data?.submittedAt ?? null,
      })),
      isError: queries.some(query => query.isError),
      isPending: queries.some(query => query.isPending),
    }),
    [queries, teams],
  );
}
