import { submitTopicVote } from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { studentHomeKeys } from '~/features/student-home/queries';

import { topicKeys } from './topicKeys';

export function useSubmitTopicVoteMutation(sectionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (candidateId: string) =>
      submitTopicVote(sectionId, { candidateId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: topicKeys.board(sectionId),
      });
      void queryClient.invalidateQueries({
        queryKey: studentHomeKeys.dashboard(sectionId),
      });
    },
  });
}
