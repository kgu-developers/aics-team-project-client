import { removeMeetingActionApi } from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { hasMeetingApiId, meetingApiKeys } from './api/meetingApiKeys';
export function useRemoveMeetingActionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: ({
      actionId,
      meetingId,
      teamId,
    }: {
      actionId: string;
      meetingId: string;
      teamId: string;
    }) => {
      if (
        !actionId ||
        !meetingId ||
        !teamId ||
        ![actionId, meetingId, teamId].every(hasMeetingApiId)
      )
        throw new Error('유효한 팀과 회의록, 액션 플랜이 필요해요.');
      return removeMeetingActionApi(actionId);
    },
    onSettled: async (_data, _error, { meetingId, teamId }) => {
      // Also reconcile an already-deleted item or a lost delete response.
      await Promise.all(
        [
          meetingApiKeys.recordActions(meetingId),
          meetingApiKeys.teamActions(teamId),
        ].map(queryKey => queryClient.invalidateQueries({ queryKey })),
      );
    },
  });
}
