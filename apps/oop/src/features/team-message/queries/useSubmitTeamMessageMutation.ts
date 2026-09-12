import { useMutation, useQueryClient } from '@tanstack/react-query';

import { teamMessageMutationOptions } from './teamMessageMutationOptions';

export function useSubmitTeamMessageMutation(teamId?: string) {
  const queryClient = useQueryClient();
  return useMutation(teamMessageMutationOptions(queryClient, teamId));
}
