import { removeMeetingRecordApi } from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { meetingApiKeys } from './meetingApiKeys';

export function useRemoveMeetingRecordApiMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ meetingId }: { teamId: string; meetingId: string }) =>
      removeMeetingRecordApi(meetingId),
    onSuccess: async (_result, { teamId, meetingId }) => {
      queryClient.removeQueries({ queryKey: meetingApiKeys.detail(meetingId) });
      queryClient.removeQueries({
        queryKey: meetingApiKeys.recordActions(meetingId),
      });
      await Promise.all(
        [meetingApiKeys.list(teamId), meetingApiKeys.teamActions(teamId)].map(
          queryKey => queryClient.invalidateQueries({ queryKey }),
        ),
      );
    },
  });
}
