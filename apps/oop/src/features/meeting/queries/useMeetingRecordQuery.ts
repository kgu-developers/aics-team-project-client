import { fetchMeetingRecord } from '@aics/api-client';
import { skipToken, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import {
  mapStudentMeeting,
  type StudentMeetingRecord,
} from '../model/studentMeeting';
import { hasMeetingApiId } from './api/meetingApiKeys';
import { useMeetingActionEntriesQuery } from './api/useMeetingActionEntriesQuery';
import { useMeetingRecordDetailQuery } from './api/useMeetingRecordDetailQuery';
import { meetingKeys } from './meetingKeys';
import { useMeetingTeamQuery } from './useMeetingTeamQuery';

export function useMeetingRecordQuery(meetingId: string | null | undefined) {
  const context = useMeetingTeamQuery();
  const valid =
    hasMeetingApiId(meetingId ?? undefined) && hasMeetingApiId(context.teamId);
  const detail = useMeetingRecordDetailQuery(
    !context.isDemo && valid ? meetingId! : undefined,
  );
  const sameTeam = detail.data?.teamId === context.teamId;
  const actions = useMeetingActionEntriesQuery(
    !context.isDemo && valid && sameTeam ? meetingId! : undefined,
  );
  const demo = useQuery({
    queryKey: meetingId ? meetingKeys.detail(meetingId) : meetingKeys.all,
    queryFn:
      context.isDemo && context.teamId && meetingId
        ? () => fetchMeetingRecord(meetingId)
        : skipToken,
  });
  const data: StudentMeetingRecord | undefined = useMemo(() => {
    if (context.isDemo) return demo.data;
    if (!sameTeam || !detail.data || !actions.data || !context.kickoff)
      return undefined;
    return mapStudentMeeting(detail.data, actions.data, context.kickoff);
  }, [
    context.isDemo,
    context.kickoff,
    demo.data,
    sameTeam,
    detail.data,
    actions.data,
  ]);
  const isError =
    context.isError ||
    (!context.isDemo &&
      (!valid ||
        detail.isError ||
        actions.isError ||
        Boolean(detail.data && !sameTeam)));
  return {
    data,
    teamId: context.teamId,
    fetchStatus: context.isDemo ? demo.fetchStatus : detail.fetchStatus,
    isError: context.isDemo ? demo.isError : isError,
    isPending:
      Boolean(context.teamId) &&
      (context.isDemo
        ? demo.isPending
        : !isError &&
          (context.isPending || detail.isPending || actions.isPending)),
    refetch: () =>
      context.isDemo
        ? demo.refetch()
        : Promise.all([
            context.refetch(),
            detail.refetch(),
            ...(sameTeam ? [actions.refetch()] : []),
          ]),
    reloadForEdit: async () => {
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
