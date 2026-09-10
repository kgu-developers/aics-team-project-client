import { mapActionPlanEntry } from '../model/actionPlan';
import { meetingTitle } from '../model/studentMeeting';
import { useMeetingRecordSummariesQuery } from './api/useMeetingRecordSummariesQuery';
import { useTeamMeetingActionEntriesQuery } from './api/useTeamMeetingActionEntriesQuery';
import { useMeetingRecordsQuery } from './useMeetingRecordsQuery';
import { useMeetingTeamQuery } from './useMeetingTeamQuery';
import { useTeamMeetingActionsQuery } from './useTeamMeetingActionsQuery';

export function useTeamActionPlanQuery() {
  const context = useMeetingTeamQuery();
  const { isDemo, teamId } = context;
  const summaries = useMeetingRecordSummariesQuery(isDemo ? undefined : teamId);
  const demoRecords = useMeetingRecordsQuery(isDemo ? teamId : undefined);
  const entries = useTeamMeetingActionEntriesQuery(isDemo ? undefined : teamId);
  const demoActions = useTeamMeetingActionsQuery(isDemo ? teamId : undefined);
  const actionsQuery = isDemo ? demoActions : entries;
  const recordsQuery = isDemo ? demoRecords : summaries;
  return {
    ...context,
    records: isDemo
      ? (demoRecords.data?.map(({ id, title }) => ({ id, title })) ?? [])
      : (summaries.data?.map(record => ({
          id: record.id,
          title: meetingTitle(record.title, record.phase),
        })) ?? []),
    actions: isDemo
      ? (demoActions.data ?? [])
      : (entries.data?.map(mapActionPlanEntry) ?? []),
    isPending: context.isPending || actionsQuery.isPending,
    isError: context.isError || actionsQuery.isError,
    recordsPending: recordsQuery.isPending,
    recordsError: recordsQuery.isError,
    canRetry:
      context.canRetry && !actionsQuery.isFetching && !recordsQuery.isFetching,
    refetch: () =>
      Promise.all([
        ...(isDemo ? [] : [context.refetch()]),
        actionsQuery.refetch(),
        recordsQuery.refetch(),
      ]),
  };
}
