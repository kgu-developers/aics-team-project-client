import { submitMeetingRecordApi } from '@aics/api-client';
import type { CreateMeetingRecordInput, MeetingPhase } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { MeetingCreateError } from '../model/meetingCreateError';
import { hasMeetingApiId, meetingApiKeys } from './api/meetingApiKeys';
export function useSubmitMeetingRecordMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: async ({
      input,
      teamId,
      phase,
    }: {
      input: CreateMeetingRecordInput;
      teamId: string;
      phase?: MeetingPhase;
    }) => {
      if (!hasMeetingApiId(teamId) || !phase)
        throw new Error('유효한 팀과 회의 단계가 필요해요.');
      try {
        return await submitMeetingRecordApi(teamId, {
          title: input.title.trim(),
          meetingAt: input.heldAt,
          phase,
          content: JSON.stringify(input.content),
          location: input.location ?? '',
          participantIds: input.participantUserIds,
        });
      } catch (error) {
        throw new MeetingCreateError(error);
      }
    },
    onSuccess: (record, { teamId }) => {
      void queryClient.invalidateQueries({
        queryKey: meetingApiKeys.list(teamId),
      });
    },
  });
}
