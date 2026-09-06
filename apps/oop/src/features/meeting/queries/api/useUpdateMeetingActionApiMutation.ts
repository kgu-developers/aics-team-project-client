import { updateMeetingActionApi } from '@aics/api-client';
import type { MeetingActionUpdateRequest } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { meetingApiKeys } from './meetingApiKeys';

export function useUpdateMeetingActionApiMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      actionId,
      input,
    }: {
      teamId: string;
      actionId: string;
      meetingId: string;
      input: MeetingActionUpdateRequest;
    }) => updateMeetingActionApi(actionId, input),
    onSuccess: async (_result, { teamId, meetingId }) => {
      await Promise.all(
        [
          meetingApiKeys.recordActions(meetingId),
          meetingApiKeys.teamActions(teamId),
        ].map(queryKey => queryClient.invalidateQueries({ queryKey })),
      );
    },
  });
}
