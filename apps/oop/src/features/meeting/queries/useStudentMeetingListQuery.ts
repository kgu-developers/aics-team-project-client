import type { MeetingPhase } from '@aics/core';

import { isMockDevelopmentMode } from '~/shared/config/developmentMode';

import { useAuthStore } from '~/features/auth/authStore';

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

const phaseLabels: Record<MeetingPhase, string> = {
  PROPOSAL: '기획',
  MID_CHECK: '중간 점검',
  FINAL: '최종',
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
        heading: phaseLabels[record.phase],
        participantCount: record.participantCount,
        actionCount: null,
        location: record.location,
        authorLabel: record.authorId,
      }));

  return {
    teamId,
    items,
    isPending: query.isPending,
    isError:
      query.isError ||
      (!usesDemoContract && teamId != null && !hasMeetingApiId(teamId)),
    refetch: query.refetch,
    canRetry:
      !query.isFetching &&
      (usesDemoContract ? Boolean(teamId) : hasMeetingApiId(teamId)),
    headingLabel: usesDemoContract ? '제목' : '회의 단계',
    authorColumnLabel: usesDemoContract ? '작성자' : '작성자 학번',
    // Only list consumption is migrated here; editor/detail consumption is KD3-156.
    canOpenRecord: usesDemoContract,
    canCreateRecord: usesDemoContract,
  };
}
