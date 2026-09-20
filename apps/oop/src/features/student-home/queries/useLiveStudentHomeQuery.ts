import {
  useMeetingRecordSummariesQuery,
  useTeamMeetingActionEntriesQuery,
} from '~/features/meeting/queries/api';
import { studentContextMessages } from '~/features/section/StudentContextState';
import { useStudentContext } from '~/features/section/useStudentContext';
import { useSectionAnnouncementsQuery } from '~/features/student-notices/queries';
import { resolveContactVisibility } from '~/features/team-assignment/liveTeamAssignment';
import { useTeamKickoffQuery } from '~/features/team-assignment/queries';

import { useTeamProjectQuery } from './useTeamProjectQuery';
import { homeQueryState } from '../model/homeQueryState';
import {
  homeAnnouncements,
  homeAssignedActions,
  homeMeetingRecords,
} from '../model/studentHomeSummary';

export function useLiveStudentHomeQuery() {
  const context = useStudentContext();
  const { identity, user, teamId } = context;
  const sectionId = context.section ? String(context.section.id) : undefined;
  const notices = useSectionAnnouncementsQuery(
    sectionId ? Number(sectionId) : undefined,
  );
  const meetings = useMeetingRecordSummariesQuery(teamId);
  const actions = useTeamMeetingActionEntriesQuery(teamId);
  const contactVisibility = resolveContactVisibility(context.section ?? {});
  const kickoff = useTeamKickoffQuery(
    !context.section || contactVisibility === 'upcoming' ? undefined : teamId,
  );
  const project = useTeamProjectQuery(teamId);
  const missingSection = !sectionId
    ? studentContextMessages[context.status]
    : undefined;
  const missingTeam = !teamId
    ? studentContextMessages[context.status]
    : undefined;
  const contextState = {
    status:
      context.status === 'error'
        ? ('error' as const)
        : context.status === 'loading'
          ? ('pending' as const)
          : ('ready' as const),
    description: studentContextMessages[context.status],
    isFetching: context.isFetching,
    onRetry: () => void context.retry(),
  };
  const stateFor = (state: ReturnType<typeof homeQueryState>) =>
    contextState.status === 'ready' ? state : contextState;
  const kickoffMatches =
    kickoff.isSuccess && String(kickoff.data.id) === teamId;
  const projectMismatch =
    project.isSuccess &&
    project.data !== null &&
    project.data !== undefined &&
    String(project.data.teamId) !== teamId;
  return {
    identity,
    context,
    sectionId,
    teamId,
    studentNumber: user?.studentNumber,
    missingSection,
    missingTeam,
    notices: {
      items: homeAnnouncements(notices.data ?? []),
      state: stateFor(homeQueryState(notices, missingSection)),
    },
    meetings: {
      items: homeMeetingRecords(
        meetings.data ?? [],
        actions.isError ? undefined : actions.data,
        kickoffMatches ? kickoff.data : undefined,
      ),
      state: stateFor(homeQueryState(meetings, missingTeam)),
      metadataState: stateFor(homeQueryState(kickoff, missingTeam)),
    },
    actions: {
      items: homeAssignedActions(actions.data ?? [], user?.studentNumber),
      state: stateFor(
        homeQueryState(
          actions,
          missingTeam ??
            (!user?.studentNumber
              ? '학생 정보를 확인해야 내 액션 플랜을 조회할 수 있어요.'
              : undefined),
        ),
      ),
    },
    project: {
      data: project.isSuccess && !projectMismatch ? project.data : undefined,
      state: projectMismatch
        ? {
            ...homeQueryState(project),
            status: 'error' as const,
            description: '현재 팀의 프로젝트를 확인할 수 없어요.',
          }
        : stateFor(homeQueryState(project, missingTeam)),
    },
    teamName: kickoffMatches ? kickoff.data.name : undefined,
    // undefined while the kickoff query is pending or failed: an empty array
    // would classify every message sender incorrectly.
    teamMemberIds: kickoffMatches
      ? kickoff.data.members.map(member => member.studentNumber)
      : undefined,
    isTeamLeader: Boolean(
      kickoffMatches &&
      user?.studentNumber &&
      kickoff.data?.members.some(
        member =>
          member.studentNumber === user.studentNumber && member.isLeader,
      ),
    ),
  };
}
