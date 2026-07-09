import { submitTeam } from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { teamKeys } from './teamKeys';

export function useSubmitTeamMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitTeam,
    onSuccess: (_team, input) => {
      queryClient.invalidateQueries({
        queryKey: teamKeys.list(input.sectionId),
      });
    },
  });
}
