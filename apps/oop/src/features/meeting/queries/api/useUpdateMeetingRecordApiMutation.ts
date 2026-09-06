import { updateMeetingRecordApi } from '@aics/api-client';
import type { MeetingRecordUpdateRequest } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { meetingApiKeys } from './meetingApiKeys';

export function useUpdateMeetingRecordApiMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      meetingId,
      input,
    }: {
      teamId: string;
      meetingId: string;
      input: MeetingRecordUpdateRequest;
    }) => updateMeetingRecordApi(meetingId, input),
    onSuccess: async (_result, { teamId, meetingId }) => {
      await Promise.all(
        [meetingApiKeys.detail(meetingId), meetingApiKeys.list(teamId)].map(
          queryKey => queryClient.invalidateQueries({ queryKey }),
        ),
      );
    },
  });
}
