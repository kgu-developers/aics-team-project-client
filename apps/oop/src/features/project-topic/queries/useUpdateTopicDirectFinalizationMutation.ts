import { updateTopicDirectFinalization } from '@aics/api-client';
import type {
  TopicDirectFinalizeInput,
  TopicFinalizeResponse,
} from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { useAuthStore } from '~/features/auth/authStore';
import { projectProposalKeys } from '~/features/proposal/queries/projectProposalKeys';
import { studentHomeKeys } from '~/features/student-home/queries';

import { topicKeys } from './topicKeys';

export function useUpdateTopicDirectFinalizationMutation(
  teamId?: string,
  sectionId?: string,
  studentNumber?: string,
  onFinalized?: (result: TopicFinalizeResponse) => void,
) {
  const queryClient = useQueryClient();
  const session = useAuthStore();
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  return useMutation({
    mutationKey: topicKeys.finalization(teamId, studentNumber, sectionId),
    retry: false,
    // Preserve ambiguous writes across accordion remounts until session clearance.
    gcTime: Infinity,
    mutationFn: (input: TopicDirectFinalizeInput) => {
      if (!teamId || !sectionId || !studentNumber)
        throw new Error('소속 분반과 팀을 먼저 확인해 주세요.');
      return updateTopicDirectFinalization(teamId, input);
    },
    onMutate: () => ({ session, teamId }),
    // Project refetch can replace the topic row and unmount its action.
    // Deliver success first; ignore a response after leaving this account/team form.
    onSuccess: (result, _input, context) => {
      if (useAuthStore.getState() === context.session)
        queryClient.removeQueries({
          queryKey: projectProposalKeys.scope(context.session, context.teamId),
        });
      if (active.current) onFinalized?.(result);
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
