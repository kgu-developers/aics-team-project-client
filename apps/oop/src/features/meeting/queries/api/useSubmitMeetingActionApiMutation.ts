import { submitMeetingActionApi } from '@aics/api-client';
import type { MeetingActionCreateRequest } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { meetingApiKeys } from './meetingApiKeys';

export function useSubmitMeetingActionApiMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      meetingId,
      input,
    }: {
      teamId: string;
      meetingId: string;
      input: MeetingActionCreateRequest;
    }) => submitMeetingActionApi(meetingId, input),
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
