import { submitTopicCandidate } from '@aics/api-client';
import type { SubmitTopicCandidateInput } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { studentHomeKeys } from '~/features/student-home/queries';

import { topicKeys } from './topicKeys';

export function useSubmitTopicCandidateMutation(sectionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SubmitTopicCandidateInput) =>
      submitTopicCandidate(sectionId, input),
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
