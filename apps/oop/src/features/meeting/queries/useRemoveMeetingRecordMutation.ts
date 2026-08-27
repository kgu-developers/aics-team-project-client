import { removeMeetingRecord } from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { meetingKeys } from './meetingKeys';

export function useRemoveMeetingRecordMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ meetingId }: { meetingId: string; teamId: string }) =>
      removeMeetingRecord(meetingId),
    onSuccess: (_, { meetingId, teamId }) => {
      void queryClient.invalidateQueries({
        queryKey: meetingKeys.list(teamId),
      });
      queryClient.removeQueries({ queryKey: meetingKeys.detail(meetingId) });
    },
  });
}
