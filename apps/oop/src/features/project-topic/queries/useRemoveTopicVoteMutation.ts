import { removeTopicVote } from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { studentHomeKeys } from '~/features/student-home/queries';

import { topicKeys } from './topicKeys';

export function useRemoveTopicVoteMutation(sectionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => removeTopicVote(sectionId),
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
