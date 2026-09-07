import type {
  SectionResponse,
  TeamAssignmentPhase,
  TeamAssignmentProjection,
  TeamKickoffResponse,
} from '@aics/core';

export type ContactVisibility = 'unscheduled' | 'upcoming' | 'open' | 'closed';
export type LiveTeamAssignmentStage =
  'result' | 'firstMeeting' | 'completed' | 'contactClosed';

function timestamp(value: string | null) {
  if (!value) return undefined;

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export function resolveContactVisibility(
  section: SectionResponse,
  now = Date.now(),
): ContactVisibility {
  const start = timestamp(section.contactVisibleFrom);
  if (start === undefined) return 'unscheduled';
  if (now < start) return 'upcoming';
  const end = timestamp(section.contactVisibleUntil);
  // An invalid configured end must not accidentally open an unlimited window.
  if (section.contactVisibleUntil && end === undefined) return 'closed';
  return end !== undefined && now > end ? 'closed' : 'open';
}

export function resolveLiveTeamAssignmentStage(
  section: SectionResponse,
  team: TeamKickoffResponse,
  now = Date.now(),
): LiveTeamAssignmentStage {
  if (team.members.some(member => member.isLeader)) return 'completed';
  const visibility = resolveContactVisibility(section, now);
  if (visibility === 'open') return 'firstMeeting';
  if (visibility === 'closed') return 'contactClosed';
  return 'result';
}

export function toTeamAssignmentProjection(
  section: SectionResponse,
  team: TeamKickoffResponse,
  phase: TeamAssignmentPhase,
  now = Date.now(),
): TeamAssignmentProjection {
  const leader = team.members.find(member => member.isLeader);
  const onboardingStart = timestamp(section.contactVisibleFrom);
  const onboardingStarted =
    onboardingStart !== undefined && now >= onboardingStart;

  return {
    sectionId: String(section.id),
    phase,
    window:
      onboardingStart !== undefined && section.contactVisibleFrom
        ? { nextAvailableAt: section.contactVisibleFrom }
        : {},
    assignedTeam: {
      id: String(team.id),
      name: team.name,
      members: team.members.map(member => ({
        id: String(member.id),
        name: member.name ?? member.studentNumber,
        studentNumber: member.studentNumber,
        role: member.projectRole ?? undefined,
      })),
      leaderId: leader ? String(leader.id) : undefined,
    },
    leaderConfirmation: leader
      ? {
          status: 'confirmed',
          isActionAvailable: false,
          unavailableReason: '팀장 확정이 완료되었습니다.',
        }
      : {
          status: 'not-confirmed',
          isActionAvailable: onboardingStarted,
          ...(onboardingStarted
            ? {}
            : {
                unavailableReason: '온보딩 시작 후 팀장을 선정할 수 있습니다.',
              }),
        },
  };
}
