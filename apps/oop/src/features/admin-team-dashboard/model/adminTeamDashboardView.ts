import type { AdminTeamDetailDto } from '@aics/api-client';

export type AdminTeamDashboardMemberView = {
  id: string;
  isLeader: boolean;
  major: string | null;
  name: string;
  projectRole: string | null;
  studentNumber: string;
};

export type AdminTeamDashboardView = {
  id: string;
  members: AdminTeamDashboardMemberView[];
  name: string;
  sectionId: string;
};

export function toAdminTeamDashboardView(
  response: AdminTeamDetailDto,
): AdminTeamDashboardView {
  return {
    id: String(response.id),
    members: response.members.map(member => ({
      id: String(member.id),
      isLeader: member.isLeader,
      major: null,
      name: member.name ?? member.studentNumber,
      projectRole: member.projectRole,
      studentNumber: member.studentNumber,
    })),
    name: response.name,
    sectionId: String(response.sectionId),
  };
}
