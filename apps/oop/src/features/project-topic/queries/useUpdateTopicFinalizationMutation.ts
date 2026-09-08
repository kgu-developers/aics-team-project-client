import { updateTopicFinalization } from '@aics/api-client';
import type { TopicFinalizeInput } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { studentHomeKeys } from '~/features/student-home/queries';

import { topicKeys } from './topicKeys';

export function useUpdateTopicFinalizationMutation(
  teamId?: string,
  sectionId?: string,
  studentNumber?: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: topicKeys.finalization(teamId, studentNumber, sectionId),
    retry: false,
    // Preserve ambiguous writes across accordion remounts until session clearance.
    gcTime: Infinity,
    mutationFn: (input: TopicFinalizeInput) => {
      if (!teamId || !sectionId || !studentNumber)
        throw new Error('소속 분반과 팀을 먼저 확인해 주세요.');
      return updateTopicFinalization(teamId, input);
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: topicKeys.teamCandidates(teamId),
        }),
        queryClient.invalidateQueries({
          queryKey: ['student-project', teamId],
          exact: true,
        }),
        ...(sectionId
          ? [
              queryClient.invalidateQueries({
                queryKey: studentHomeKeys.dashboard(sectionId),
              }),
            ]
          : []),
      ]);
    },
  });
}
