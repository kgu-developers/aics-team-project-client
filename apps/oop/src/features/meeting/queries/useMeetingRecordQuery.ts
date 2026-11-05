import {
  fetchMeetingRecordDetail,
  fetchMeetingActionEntries,
} from '@aics/api-client';
import { skipToken, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import {
  mapStudentMeeting,
  type StudentMeetingRecord,
} from '../model/studentMeeting';
import { hasMeetingApiId, meetingApiKeys } from './api/meetingApiKeys';
import { useMeetingTeamQuery } from './useMeetingTeamQuery';

export function useMeetingRecordQuery(meetingId: string | null | undefined) {
  const context = useMeetingTeamQuery();
  const valid =
    hasMeetingApiId(meetingId ?? undefined) && hasMeetingApiId(context.teamId);
  const recordId = hasMeetingApiId(meetingId ?? undefined)
    ? meetingId!
    : undefined;
  const detail = useQuery({
    queryKey: meetingApiKeys.detail(recordId),
    queryFn:
      recordId && valid ? () => fetchMeetingRecordDetail(recordId) : skipToken,
  });
  const sameTeam = detail.data?.teamId === context.team?.id;
  const actions = useQuery({
    queryKey: meetingApiKeys.recordActions(recordId),
    queryFn:
      recordId && valid && sameTeam
        ? () => fetchMeetingActionEntries(recordId)
        : skipToken,
  });
  const data: StudentMeetingRecord | undefined = useMemo(() => {
    if (!sameTeam || !detail.data || !actions.data || !context.kickoff)
      return undefined;
    return mapStudentMeeting(detail.data, actions.data, context.kickoff);
  }, [context.kickoff, sameTeam, detail.data, actions.data]);
  const isError =
    context.isError ||
    !valid ||
    detail.isError ||
    actions.isError ||
    Boolean(detail.data && !sameTeam);
  return {
    data,
    context,
    teamId: context.teamId,
    fetchStatus: detail.fetchStatus,
    isError: isError,
    isPending:
      Boolean(context.teamId) &&
      !isError &&
      (context.isPending || detail.isPending || actions.isPending),
    refetch: async () => {
      if (!context.teamId) return context.refetch();
      if (!valid) return;
      const result = await detail.refetch();
      if (result.isSuccess && result.data.teamId === context.teamId && sameTeam)
        await actions.refetch();
      return result;
    },
    reloadForEdit: async () => {
      if (!context.teamId || !valid || context.isError || context.isPending)
        throw new Error('현재 팀의 회의록을 확인하지 못했어요.');
      const result = await detail.refetch({ throwOnError: true });
      if (
        !result.data ||
        result.data.teamId !== context.teamId ||
        !context.kickoff
      )
        throw new Error('현재 팀의 회의록을 확인하지 못했어요.');
      return mapStudentMeeting(
        result.data,
        actions.data ?? [],
        context.kickoff,
      );
    },
  };
}
