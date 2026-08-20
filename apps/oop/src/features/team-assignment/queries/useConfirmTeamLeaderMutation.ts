import { confirmTeamLeader } from '@aics/api-client';
import type { ConfirmTeamLeaderInput, TeamAssignmentPhase } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { teamAssignmentQueryKey } from './teamAssignmentKeys';

type ConfirmTeamLeaderVariables = {
  developmentPreview?: TeamAssignmentPhase;
  input: ConfirmTeamLeaderInput;
};

export function useConfirmTeamLeaderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ developmentPreview, input }: ConfirmTeamLeaderVariables) =>
      confirmTeamLeader(input, developmentPreview),
    onSuccess: (_projection, { input }) =>
      queryClient.invalidateQueries({
        queryKey: teamAssignmentQueryKey(input.sectionId),
      }),
  });
}
