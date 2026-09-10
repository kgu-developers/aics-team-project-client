import { updateMeetingAction, updateMeetingActionApi } from '@aics/api-client';
import type { UpdateMeetingActionInput } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { isMockDevelopmentMode } from '~/shared/config/developmentMode';

import { updateActionRequest } from '../model/actionPlan';
import { hasMeetingApiId, meetingApiKeys } from './api/meetingApiKeys';
import { meetingKeys } from './meetingKeys';

export function useUpdateMeetingActionMutation() {
  const queryClient = useQueryClient();
  const isDemo = isMockDevelopmentMode(
    import.meta.env.DEV,
    import.meta.env.VITE_ENABLE_MSW,
  );
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
      if (isDemo) return updateMeetingAction(actionId, input);
      if (
        !hasMeetingApiId(teamId) ||
        !hasMeetingApiId(meetingId) ||
        !hasMeetingApiId(actionId)
      )
        throw new Error('유효한 팀과 액션 플랜이 필요해요.');
      return updateMeetingActionApi(actionId, updateActionRequest(input));
    },
    onSuccess: (_, { meetingId, teamId }) => {
      if (!isDemo) {
        void queryClient.invalidateQueries({
          queryKey: meetingApiKeys.recordActions(meetingId),
        });
        void queryClient.invalidateQueries({
          queryKey: meetingApiKeys.teamActions(teamId),
        });
        return;
      }
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
