import { useMeetingRecordSummariesQuery } from './api/useMeetingRecordSummariesQuery';
import { useMeetingTeamQuery } from './useMeetingTeamQuery';
import { meetingTitle } from '../model/studentMeeting';

export type StudentMeetingListItem = {
  id: string;
  heldAt: string;
  heading: string;
  participantCount: number;
  actionCount: number | null;
  location: string | null;
  authorLabel: string;
};

export function useStudentMeetingListQuery() {
  const context = useMeetingTeamQuery();
  const { teamId, kickoff } = context;
  const summaries = useMeetingRecordSummariesQuery(teamId);
  const query = summaries;
  const items: StudentMeetingListItem[] | undefined = summaries.data?.map(
    record => ({
      id: record.id,
      heldAt: record.meetingAt,
      heading: meetingTitle(record.title, record.phase),
      participantCount: record.participantCount,
      actionCount: null,
      location: record.location,
      authorLabel:
        kickoff?.members.find(
          member => member.studentNumber === record.authorId,
        )?.name || record.authorId,
    }),
  );
  return {
    teamId,
    items,
    context,
    isPending: context.isPending || (Boolean(teamId) && query.isPending),
    isError: context.isError || query.isError,
    refetch: async () => {
      if (!teamId) return context.refetch();
      return query.refetch();
    },
    canRetry: context.canRetry && !query.isFetching,
    headingLabel: '제목',
    authorColumnLabel: '작성자',
    canOpenRecord: true,
    canCreateRecord: true,
  };
}
