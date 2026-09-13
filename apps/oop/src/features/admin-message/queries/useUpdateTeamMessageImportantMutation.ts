import { updateTeamMessageImportant } from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { teamMessageKeys } from '~/features/team-message/queries/teamMessageKeys';

export function useUpdateTeamMessageImportantMutation(teamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      messageId,
      important,
    }: {
      messageId: number;
      important: boolean;
    }) => updateTeamMessageImportant(messageId, important),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: teamMessageKeys.team(teamId) }),
  });
}
