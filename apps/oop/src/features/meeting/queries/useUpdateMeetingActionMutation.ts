import { updateMeetingAction } from '@aics/api-client';
import type { UpdateMeetingActionInput } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { meetingKeys } from './meetingKeys';

export function useUpdateMeetingActionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      actionId,
      input,
    }: {
      actionId: string;
      input: UpdateMeetingActionInput;
      meetingId: string;
      teamId: string;
    }) => updateMeetingAction(actionId, input),
    onSuccess: (_, { meetingId, teamId }) => {
      void queryClient.invalidateQueries({
        queryKey: meetingKeys.detail(meetingId),
      });
      void queryClient.invalidateQueries({
        queryKey: meetingKeys.list(teamId),
      });
    },
  });
}
