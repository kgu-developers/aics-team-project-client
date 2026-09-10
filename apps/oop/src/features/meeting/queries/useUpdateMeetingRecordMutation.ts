import { updateMeetingRecord, updateMeetingRecordApi } from '@aics/api-client';
import type { MeetingPhase, UpdateMeetingRecordInput } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { isMockDevelopmentMode } from '~/shared/config/developmentMode';

import { useAuthStore } from '~/features/auth/authStore';
import { studentHomeKeys } from '~/features/student-home/queries/studentHomeKeys';

import { MeetingEditLockError } from '../model/meetingEditLock';
import { meetingUpdateRequest } from '../model/meetingUpdate';
import { MeetingUpdateError } from '../model/meetingUpdateError';
import type { StudentMeetingRecord } from '../model/studentMeeting';
import { hasMeetingApiId, meetingApiKeys } from './api/meetingApiKeys';
import { meetingKeys } from './meetingKeys';

export function useUpdateMeetingRecordMutation() {
  const queryClient = useQueryClient();
  const session = useAuthStore();
  const isDemo = isMockDevelopmentMode(
    import.meta.env.DEV,
    import.meta.env.VITE_ENABLE_MSW,
  );
  return useMutation({
    retry: false,
    onMutate: () => ({ session }),
    mutationFn: async ({
      input,
      meetingId,
      teamId,
      original,
      phase,
      confirmOwnership,
    }: {
      input: UpdateMeetingRecordInput;
      meetingId: string;
      teamId: string;
      original?: StudentMeetingRecord;
      phase?: MeetingPhase;
      confirmOwnership?: () => Promise<boolean>;
    }) => {
      if (!teamId || !meetingId)
        throw new Error('유효한 팀과 회의록이 필요해요.');
      if (isDemo) {
        try {
          return await updateMeetingRecord(meetingId, input);
        } catch (error) {
          throw new MeetingUpdateError(error);
        }
      }
      if (
        !hasMeetingApiId(teamId) ||
        !hasMeetingApiId(meetingId) ||
        !original ||
        original.id !== meetingId ||
        original.teamId !== teamId ||
        !original.phase ||
        !phase
      )
        throw new Error('유효한 팀과 회의록 원본, 회의 단계가 필요해요.');
      const patch = meetingUpdateRequest(original, input, phase);
      if (Object.keys(patch).length === 0) return { id: meetingId };
      if (
        useAuthStore.getState() !== session ||
        !confirmOwnership ||
        !(await confirmOwnership()) ||
        useAuthStore.getState() !== session
      )
        throw new MeetingEditLockError();
      try {
        const result = await updateMeetingRecordApi(meetingId, patch);
        if (useAuthStore.getState() !== session)
          throw new MeetingEditLockError();
        return result;
      } catch (error) {
        if (error instanceof MeetingEditLockError) throw error;
        throw new MeetingUpdateError(error);
      }
    },
    onSuccess: (record, { meetingId }, context) => {
      if (isDemo && context?.session === useAuthStore.getState())
        queryClient.setQueryData(meetingKeys.detail(meetingId), record);
    },
    onSettled: (_record, _error, { meetingId, teamId }, context) => {
      if (!teamId || !meetingId || context?.session !== useAuthStore.getState())
        return;
      // A lost PATCH response may still have persisted. Reconcile on revisit.
      for (const queryKey of [
        meetingKeys.list(teamId),
        meetingKeys.detail(meetingId),
        meetingKeys.actions(teamId),
        meetingApiKeys.list(teamId),
        meetingApiKeys.detail(meetingId),
        meetingApiKeys.teamActions(teamId),
        studentHomeKeys.dashboards(),
      ])
        void queryClient.invalidateQueries({ queryKey });
    },
  });
}
