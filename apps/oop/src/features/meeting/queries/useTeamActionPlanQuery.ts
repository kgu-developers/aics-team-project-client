import { mapActionPlanEntry } from '../model/actionPlan';
import { meetingTitle } from '../model/studentMeeting';
import { useMeetingRecordSummariesQuery } from './api/useMeetingRecordSummariesQuery';
import { useTeamMeetingActionEntriesQuery } from './api/useTeamMeetingActionEntriesQuery';
import { useMeetingTeamQuery } from './useMeetingTeamQuery';
export function useTeamActionPlanQuery() {
  const context = useMeetingTeamQuery();
  const { teamId } = context;
  const summaries = useMeetingRecordSummariesQuery(teamId);
  const entries = useTeamMeetingActionEntriesQuery(teamId);
  const actionsQuery = entries;
  const recordsQuery = summaries;
  return {
    ...context,
    records:
      summaries.data?.map(record => ({
        id: record.id,
        title: meetingTitle(record.title, record.phase),
      })) ?? [],
    actions: entries.data?.map(mapActionPlanEntry) ?? [],
    isPending: context.isPending || (Boolean(teamId) && actionsQuery.isPending),
    isError: context.isError || actionsQuery.isError,
    recordsPending: recordsQuery.isPending,
    recordsError: recordsQuery.isError,
    canRetry:
      context.canRetry && !actionsQuery.isFetching && !recordsQuery.isFetching,
    refetch: async () => {
      if (!teamId) {
        await context.refetch();
        return [];
      }
      return Promise.all([actionsQuery.refetch(), recordsQuery.refetch()]);
    },
  };
}
