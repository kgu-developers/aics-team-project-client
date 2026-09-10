import { submitMeetingAction, submitMeetingActionApi } from '@aics/api-client';
import type { CreateMeetingActionInput } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { isMockDevelopmentMode } from '~/shared/config/developmentMode';

import { createActionRequest } from '../model/actionPlan';
import { hasMeetingApiId, meetingApiKeys } from './api/meetingApiKeys';
import { meetingKeys } from './meetingKeys';

export function useSubmitMeetingActionMutation() {
  const queryClient = useQueryClient();
  const isDemo = isMockDevelopmentMode(
    import.meta.env.DEV,
    import.meta.env.VITE_ENABLE_MSW,
  );
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
      if (isDemo) return submitMeetingAction(meetingId, input);
      if (!hasMeetingApiId(teamId) || !hasMeetingApiId(meetingId))
        throw new Error('유효한 팀과 회의록이 필요해요.');
      return submitMeetingActionApi(meetingId, createActionRequest(input));
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
