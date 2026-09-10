import { removeMeetingActionApi } from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { isMockDevelopmentMode } from '~/shared/config/developmentMode';

import { hasMeetingApiId, meetingApiKeys } from './api/meetingApiKeys';
import { meetingKeys } from './meetingKeys';

export function useRemoveMeetingActionMutation() {
  const queryClient = useQueryClient();
  const isDemo = isMockDevelopmentMode(
    import.meta.env.DEV,
    import.meta.env.VITE_ENABLE_MSW,
  );
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
        (!isDemo && ![actionId, meetingId, teamId].every(hasMeetingApiId))
      )
        throw new Error('유효한 팀과 회의록, 액션 플랜이 필요해요.');
      return removeMeetingActionApi(actionId);
    },
    onSettled: async (_data, _error, { meetingId, teamId }) => {
      // Also reconcile an already-deleted item or a lost delete response.
      await Promise.all(
        (isDemo
          ? [
              meetingKeys.detail(meetingId),
              meetingKeys.list(teamId),
              meetingKeys.actions(teamId),
            ]
          : [
              meetingApiKeys.recordActions(meetingId),
              meetingApiKeys.teamActions(teamId),
            ]
        ).map(queryKey => queryClient.invalidateQueries({ queryKey })),
      );
    },
  });
}
