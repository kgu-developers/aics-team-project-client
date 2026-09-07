import { submitMeetingRecord, submitMeetingRecordApi } from '@aics/api-client';
import type { CreateMeetingRecordInput, MeetingPhase } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { isMockDevelopmentMode } from '~/shared/config/developmentMode';

import { MeetingCreateError } from '../model/meetingCreateError';
import { hasMeetingApiId, meetingApiKeys } from './api/meetingApiKeys';
import { meetingKeys } from './meetingKeys';

export function useSubmitMeetingRecordMutation() {
  const queryClient = useQueryClient();
  const isDemo = isMockDevelopmentMode(
    import.meta.env.DEV,
    import.meta.env.VITE_ENABLE_MSW,
  );
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
      if (isDemo) return submitMeetingRecord(teamId, input);
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
        queryKey: isDemo
          ? meetingKeys.list(teamId)
          : meetingApiKeys.list(teamId),
      });
      if (isDemo)
        queryClient.setQueryData(meetingKeys.detail(record.id), record);
    },
  });
}
