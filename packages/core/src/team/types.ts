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
