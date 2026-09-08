import {
  removeTopicCandidateVote,
  submitTeamTopicCandidate,
  submitTopicCandidateVote,
} from '@aics/api-client';
import type { SubmitTopicCandidateInput } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { studentHomeKeys } from '~/features/student-home/queries';

import { topicKeys } from './topicKeys';

type TopicAction =
  | { type: 'candidate'; input: SubmitTopicCandidateInput }
  | { type: 'vote' | 'cancel'; candidateId: string };

export function useLiveTopicParticipationMutation(
  teamId?: string,
  sectionId?: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: async (action: TopicAction) => {
      if (!teamId) throw new Error('팀을 먼저 확인해 주세요.');
      switch (action.type) {
        case 'candidate':
          await submitTeamTopicCandidate(teamId, action.input);
          break;
        case 'vote':
          await submitTopicCandidateVote(action.candidateId);
          break;
        case 'cancel':
          await removeTopicCandidateVote(action.candidateId);
      }
    },
    // Even a failed response can follow a committed write. Reconcile through GET;
    // never automatically replay candidate creation or a vote action.
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: topicKeys.teamCandidates(teamId),
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
