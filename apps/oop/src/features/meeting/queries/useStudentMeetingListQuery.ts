import { isMockDevelopmentMode } from '~/shared/config/developmentMode';

import { useAuthStore } from '~/features/auth/authStore';
import { useTeamKickoffQuery } from '~/features/team-assignment/queries';

import { meetingTitle } from '../model/studentMeeting';
import { hasMeetingApiId } from './api/meetingApiKeys';
import { useMeetingRecordSummariesQuery } from './api/useMeetingRecordSummariesQuery';
import { useMeetingRecordsQuery } from './useMeetingRecordsQuery';

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
  const currentUser = useAuthStore(state => state.currentUser);
  // Keep the existing demo contract at the feature boundary until CRUD migrates.
  const usesDemoContract = isMockDevelopmentMode(
    import.meta.env.DEV,
    import.meta.env.VITE_ENABLE_MSW,
  );
  const teamId = usesDemoContract
    ? currentUser?.currentTeam?.id
    : (currentUser?.teamId ?? undefined);
  const kickoff = useTeamKickoffQuery(usesDemoContract ? undefined : teamId);
  const summaries = useMeetingRecordSummariesQuery(
    usesDemoContract ? undefined : teamId,
  );
  const records = useMeetingRecordsQuery(usesDemoContract ? teamId : undefined);
  const query = usesDemoContract ? records : summaries;
  const items: StudentMeetingListItem[] | undefined = usesDemoContract
    ? records.data?.map(record => ({
        id: record.id,
        heldAt: record.heldAt,
        heading: record.title,
        participantCount: record.participants.length,
        actionCount: record.actions.length,
        location: record.location,
        authorLabel: record.createdBy.name,
      }))
    : summaries.data?.map(record => ({
        id: record.id,
        heldAt: record.meetingAt,
        heading: meetingTitle(record.title, record.phase),
        participantCount: record.participantCount,
        actionCount: null,
        location: record.location,
        authorLabel:
          kickoff.data?.members.find(
            member => member.studentNumber === record.authorId,
          )?.name || record.authorId,
      }));

  return {
    teamId,
    items,
    isPending: query.isPending || (!usesDemoContract && kickoff.isPending),
    isError:
      query.isError ||
      (!usesDemoContract && kickoff.isError) ||
      (!usesDemoContract && teamId != null && !hasMeetingApiId(teamId)),
    refetch: () =>
      usesDemoContract
        ? query.refetch()
        : Promise.all([query.refetch(), kickoff.refetch()]),
    canRetry:
      !query.isFetching &&
      (usesDemoContract || !kickoff.isFetching) &&
      (usesDemoContract ? Boolean(teamId) : hasMeetingApiId(teamId)),
    headingLabel: '제목',
    authorColumnLabel: '작성자',
    canOpenRecord: true,
    canCreateRecord: true,
  };
}
