export type TeamMember = {
  id: string;
  name: string;
  role?: string;
};

export type Team = {
  id: string;
  sectionId: string;
  name: string;
  members: TeamMember[];
};

export type SubmitTeamInput = {
  sectionId: string;
  name: string;
};

export type AdminTeamDashboardMember = {
  id: string;
  name: string;
  studentNumber: string;
  major: string;
  isLeader: boolean;
  projectRole: 'ENGINE' | 'GUI' | null;
};

export type AdminTeamDashboard = {
  id: string;
  section: {
    id: string;
    code: string;
  };
  name: string;
  projectTopic: string | null;
  members: AdminTeamDashboardMember[];
};
