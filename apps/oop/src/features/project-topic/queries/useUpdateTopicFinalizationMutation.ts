import { updateTopicFinalization } from '@aics/api-client';
import type { TopicFinalizeInput, TopicFinalizeResponse } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { studentHomeKeys } from '~/features/student-home/queries';

import { topicKeys } from './topicKeys';

export function useUpdateTopicFinalizationMutation(
  teamId?: string,
  sectionId?: string,
  studentNumber?: string,
  onFinalized?: (result: TopicFinalizeResponse) => void,
) {
  const queryClient = useQueryClient();
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
    mutationFn: (input: TopicFinalizeInput) => {
      if (!teamId || !sectionId || !studentNumber)
        throw new Error('소속 분반과 팀을 먼저 확인해 주세요.');
      return updateTopicFinalization(teamId, input);
    },
    // Project refetch can replace the topic row and unmount its action.
    // Deliver success first; ignore a response after leaving this account/team form.
    onSuccess: result => {
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
