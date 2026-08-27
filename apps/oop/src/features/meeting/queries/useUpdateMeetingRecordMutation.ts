import { updateMeetingRecord } from '@aics/api-client';
import type { UpdateMeetingRecordInput } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { meetingKeys } from './meetingKeys';

export function useUpdateMeetingRecordMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      input,
      meetingId,
    }: {
      input: UpdateMeetingRecordInput;
      meetingId: string;
      teamId: string;
    }) => updateMeetingRecord(meetingId, input),
    onSuccess: (record, { meetingId, teamId }) => {
      void queryClient.invalidateQueries({
        queryKey: meetingKeys.list(teamId),
      });
      queryClient.setQueryData(meetingKeys.detail(meetingId), record);
    },
  });
}
