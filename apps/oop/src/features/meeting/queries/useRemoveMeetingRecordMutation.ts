import { removeMeetingRecord } from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { meetingApiKeys } from './api/meetingApiKeys';
import { meetingKeys } from './meetingKeys';

export function useRemoveMeetingRecordMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ meetingId }: { meetingId: string; teamId: string }) =>
      removeMeetingRecord(meetingId),
    onSuccess: (_, { meetingId, teamId }) => {
      queryClient.removeQueries({ queryKey: meetingApiKeys.detail(meetingId) });
      queryClient.removeQueries({
        queryKey: meetingApiKeys.recordActions(meetingId),
      });
      for (const queryKey of [
        meetingApiKeys.list(teamId),
        meetingApiKeys.teamActions(teamId),
      ])
        void queryClient.invalidateQueries({ queryKey });
      void queryClient.invalidateQueries({
        queryKey: meetingKeys.list(teamId),
      });
      queryClient.removeQueries({ queryKey: meetingKeys.detail(meetingId) });
    },
  });
}
