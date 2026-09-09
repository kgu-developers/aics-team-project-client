export type TeamMember = {
  id: string;
  name: string;
  isLeader?: boolean;
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

/**
 * Contact details returned by the student-team contacts endpoint.
 *
 * Keep the wire names here (`phone`, rather than the legacy projection-only
 * `phoneNumber`) so the API boundary remains aligned with Swagger.
 */
export type TeamMemberContact = {
  studentNumber: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  isLeader: boolean;
};

export type TeamMemberContactResponse = TeamMemberContact;

export type TeamMemberContactListResponse = {
  contents: TeamMemberContact[];
};

export type TeamKickoffMemberResponse = {
  id: number;
  studentNumber: string;
  name?: string | null;
  isLeader: boolean;
  projectRole?: string | null;
};

export type TeamKickoffResponse = {
  id: number;
  name: string;
  kickoffRule?: string | null;
  meetingSchedule?: string | null;
  members: TeamKickoffMemberResponse[];
};
