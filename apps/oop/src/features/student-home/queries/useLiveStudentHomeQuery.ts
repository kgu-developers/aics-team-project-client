import {
  useMeetingRecordSummariesQuery,
  useTeamMeetingActionEntriesQuery,
} from '~/features/meeting/queries/api';
import { useSectionAnnouncementsQuery } from '~/features/student-notices/queries';
import { useTeamKickoffQuery } from '~/features/team-assignment/queries';
import { isValidPositiveTeamId } from '~/features/team-assignment/queries/useTeamMemberContactsQuery';

import { useStudentHomeUserQuery } from './useStudentHomeUserQuery';
import { useTeamProjectQuery } from './useTeamProjectQuery';
import { homeQueryState } from '../model/homeQueryState';
import {
  homeAnnouncements,
  homeAssignedActions,
  homeMeetingRecords,
} from '../model/studentHomeSummary';

export function useLiveStudentHomeQuery() {
  const identity = useStudentHomeUserQuery();
  const user = identity.isSuccess ? identity.data : undefined;
  const sectionId =
    user?.sections.length === 1 &&
    isValidPositiveTeamId(user.sections[0]?.id) &&
    Number.isSafeInteger(Number(user.sections[0]?.id))
      ? user.sections[0]!.id
      : undefined;
  const teamId =
    sectionId && isValidPositiveTeamId(user?.teamId ?? undefined)
      ? (user?.teamId ?? undefined)
      : undefined;
  const notices = useSectionAnnouncementsQuery(
    sectionId ? Number(sectionId) : undefined,
  );
  const meetings = useMeetingRecordSummariesQuery(teamId);
  const actions = useTeamMeetingActionEntriesQuery(teamId);
  const kickoff = useTeamKickoffQuery(teamId);
  const project = useTeamProjectQuery(teamId);
  const missingSection = !sectionId
    ? (user?.sections.length ?? 0) > 1
      ? '여러 분반이 등록되어 있어요. 현재 분반을 확인해야 홈을 조회할 수 있어요.'
      : '수강 분반 배정이 완료되면 학생 홈을 이용할 수 있어요.'
    : undefined;
  const missingTeam =
    missingSection ??
    (!teamId
      ? '팀 배정이 완료되면 이곳에서 팀 자료를 확인할 수 있어요.'
      : undefined);

  const identityState = homeQueryState(identity);
  const stateFor = (state: ReturnType<typeof homeQueryState>) =>
    identityState.status === 'ready' ? state : identityState;

  return {
    identity,
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
        kickoff.data,
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
      data: project.data,
      state: stateFor(homeQueryState(project, missingTeam)),
    },
    teamName: kickoff.data?.name,
  };
}
