import { submitMeetingAction } from '@aics/api-client';
import type { CreateMeetingActionInput } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { meetingKeys } from './meetingKeys';

export function useSubmitMeetingActionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      input,
      meetingId,
    }: {
      input: CreateMeetingActionInput;
      meetingId: string;
      teamId: string;
    }) => submitMeetingAction(meetingId, input),
    onSuccess: (_, { meetingId, teamId }) => {
      void queryClient.invalidateQueries({
        queryKey: meetingKeys.detail(meetingId),
      });
      void queryClient.invalidateQueries({
        queryKey: meetingKeys.list(teamId),
      });
      void queryClient.invalidateQueries({
        queryKey: meetingKeys.actions(teamId),
      });
    },
  });
}
