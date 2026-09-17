import { updateTeamMessageRead } from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { teamMessageKeys } from './teamMessageKeys';

export function useUpdateTeamMessageReadMutation(teamId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: number) => updateTeamMessageRead(messageId),
    retry: false,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: teamMessageKeys.team(teamId) }),
  });
}
