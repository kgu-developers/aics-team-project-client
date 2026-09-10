import {
  fetchMyTeamMilestoneSubmission,
  fetchStudentMilestones,
} from '@aics/api-client';
import { skipToken, useQueries, useQuery } from '@tanstack/react-query';

import { studentHomeKeys } from './studentHomeKeys';

export function useStudentMilestonesQuery(sectionId?: string, teamId?: string) {
  const list = useQuery({
    queryKey: [...studentHomeKeys.all, 'milestones', sectionId],
    queryFn: sectionId ? () => fetchStudentMilestones(sectionId) : skipToken,
    retry: false,
  });
  const milestones = list.isSuccess
    ? [...list.data]
        .filter(item => item.status !== 'DRAFT')
        .sort((a, b) => a.weekNumber - b.weekNumber || a.id - b.id)
    : [];
  const submissions = useQueries({
    queries: milestones.map(milestone => ({
      queryKey: studentHomeKeys.submission(sectionId, teamId, milestone.id),
      queryFn:
        teamId && milestone.type !== 'PEER_EVALUATION'
          ? () => fetchMyTeamMilestoneSubmission(String(milestone.id), teamId)
          : skipToken,
      retry: false,
    })),
  });
  return {
    list,
    milestones,
    submissions,
    isPending:
      list.isPending ||
      Boolean(
        teamId &&
        submissions.some(
          (query, index) =>
            milestones[index]?.type !== 'PEER_EVALUATION' && query.isPending,
        ),
      ),
    isFetching: list.isFetching || submissions.some(query => query.isFetching),
    error: list.error ?? submissions.find(query => query.isError)?.error,
    refetch: async () => {
      if (list.isError || !submissions.some(query => query.isError))
        await list.refetch();
      await Promise.all(
        submissions
          .filter(query => query.isError)
          .map(query => query.refetch()),
      );
    },
  };
}
