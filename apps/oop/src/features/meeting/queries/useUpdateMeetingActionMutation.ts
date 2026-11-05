import { updateMeetingActionApi } from '@aics/api-client';
import type { UpdateMeetingActionInput } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateActionRequest } from '../model/actionPlan';
import { hasMeetingApiId, meetingApiKeys } from './api/meetingApiKeys';
export function useUpdateMeetingActionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: async ({
      actionId,
      input,
      teamId,
      meetingId,
    }: {
      actionId: string;
      input: UpdateMeetingActionInput;
      meetingId: string;
      teamId: string;
    }) => {
      if (
        !hasMeetingApiId(teamId) ||
        !hasMeetingApiId(meetingId) ||
        !hasMeetingApiId(actionId)
      )
        throw new Error('유효한 팀과 액션 플랜이 필요해요.');
      return updateMeetingActionApi(actionId, updateActionRequest(input));
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
