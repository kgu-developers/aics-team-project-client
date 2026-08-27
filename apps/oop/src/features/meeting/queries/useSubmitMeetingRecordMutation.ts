import { submitMeetingRecord } from '@aics/api-client';
import type { CreateMeetingRecordInput } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { meetingKeys } from './meetingKeys';

export function useSubmitMeetingRecordMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      input,
      teamId,
    }: {
      input: CreateMeetingRecordInput;
      teamId: string;
    }) => submitMeetingRecord(teamId, input),
    onSuccess: (record, { teamId }) => {
      void queryClient.invalidateQueries({
        queryKey: meetingKeys.list(teamId),
      });
      queryClient.setQueryData(meetingKeys.detail(record.id), record);
    },
  });
}
