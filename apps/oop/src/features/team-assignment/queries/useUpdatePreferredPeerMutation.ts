import { submitTeamAssignmentSurvey } from '@aics/api-client';
import type { TeamAssignmentSurvey } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  livePreSurveyProjectionQueryKey,
  teamAssignmentSurveyQueryKey,
} from './teamAssignmentKeys';

type Variables = {
  preferredPeerUserId: string | null;
  survey: TeamAssignmentSurvey;
};

export function useUpdatePreferredPeerMutation(sectionId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ preferredPeerUserId, survey }: Variables) =>
      submitTeamAssignmentSurvey({
        preferredPeerUserId,
        sectionId,
        survey,
      }),
    onSuccess: async response => {
      queryClient.setQueryData(
        teamAssignmentSurveyQueryKey(sectionId),
        response,
      );
      await queryClient.invalidateQueries({
        queryKey: livePreSurveyProjectionQueryKey(sectionId),
      });
    },
  });
}
