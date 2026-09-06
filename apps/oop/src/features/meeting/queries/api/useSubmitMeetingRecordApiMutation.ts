import { submitMeetingRecordApi } from '@aics/api-client';
import type { MeetingRecordCreateRequest } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { meetingApiKeys } from './meetingApiKeys';

export function useSubmitMeetingRecordApiMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      teamId,
      input,
    }: {
      teamId: string;
      input: MeetingRecordCreateRequest;
    }) => submitMeetingRecordApi(teamId, input),
    onSuccess: (_result, { teamId }) =>
      queryClient.invalidateQueries({ queryKey: meetingApiKeys.list(teamId) }),
  });
}
