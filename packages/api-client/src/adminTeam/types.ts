export type AdminSectionTeamSummaryDto = {
  id: number;
  name: string;
  kickoffRule: string | null;
  meetingSchedule: string | null;
  status: string;
  createdAt: string;
};

export type AdminSectionTeamsResponse = {
  contents: AdminSectionTeamSummaryDto[];
};

export type AdminTeamMemberDto = {
  id: number;
  studentNumber: string;
  name: string;
  isLeader: boolean;
  projectRole: string | null;
};

export type AdminTeamDetailDto = AdminSectionTeamSummaryDto & {
  sectionId: number;
  members: AdminTeamMemberDto[];
};
