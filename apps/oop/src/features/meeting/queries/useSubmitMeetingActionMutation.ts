import { submitMeetingActionApi } from '@aics/api-client';
import type { CreateMeetingActionInput } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createActionRequest } from '../model/actionPlan';
import { hasMeetingApiId, meetingApiKeys } from './api/meetingApiKeys';
export function useSubmitMeetingActionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: async ({
      input,
      meetingId,
      teamId,
    }: {
      input: CreateMeetingActionInput;
      meetingId: string;
      teamId: string;
    }) => {
      if (!hasMeetingApiId(teamId) || !hasMeetingApiId(meetingId))
        throw new Error('유효한 팀과 회의록이 필요해요.');
      return submitMeetingActionApi(meetingId, createActionRequest(input));
    },
    onSuccess: (_, { meetingId, teamId }) => {
      void queryClient.invalidateQueries({
        queryKey: meetingApiKeys.recordActions(meetingId),
      });
      void queryClient.invalidateQueries({
        queryKey: meetingApiKeys.teamActions(teamId),
      });
    },
  });
}
