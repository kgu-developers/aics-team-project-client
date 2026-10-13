export type AdminTeamStatus = 'FORMING' | 'CONFIRMED';

export type AdminSectionTeamSummaryDto = {
  id: number;
  name: string;
  kickoffRule: string | null;
  meetingSchedule: string | null;
  status: AdminTeamStatus;
  createdAt: string;
};

export type AdminSectionTeamsResponse = {
  contents: AdminSectionTeamSummaryDto[];
};

export type UnfinalizeAdminSectionTeamsInput = {
  reason: string;
};

export type AdminTeamMemberDto = {
  id: number;
  studentNumber: string;
  name: string;
  major: string | null;
  isLeader: boolean;
  projectRole: string | null;
};

export type AdminTeamDetailDto = AdminSectionTeamSummaryDto & {
  sectionId: number;
  members: AdminTeamMemberDto[];
};
