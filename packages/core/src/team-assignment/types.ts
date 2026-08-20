export type TeamAssignmentPhase =
  'survey' | 'resultWaiting' | 'result' | 'firstMeeting' | 'completed';
export type TeamRolePreference =
  | 'TEAM_LEADER'
  | 'DEVELOPMENT'
  | 'RESEARCH'
  | 'DESIGN'
  | 'DOCUMENTATION_PRESENTATION';
export type TeamAssignmentSurvey = {
  rolePreferences: TeamRolePreference[];
  topicIdea: string;
  note?: string;
};

export type PartnerCandidate = {
  id: string;
  name: string;
  studentNumber: string;
  program?: string;
};

export type IncomingPartnerRequest = {
  id: string;
  requester: PartnerCandidate;
  status: 'pending';
};
export type OutgoingPartnerRequest = {
  id: string;
  recipient: PartnerCandidate;
  status: 'pending';
};
export type TeamAssignmentMember = {
  id: string;
  name: string;
  studentNumber: string;
  department?: string;
  role?: string;
  phoneNumber?: string;
};
export type TeamAssignmentProjection = {
  sectionId: string;
  phase: TeamAssignmentPhase;
  window: {
    closesAt?: string;
    resultReleasesAt?: string;
    nextAvailableAt?: string;
  };
  survey?: TeamAssignmentSurvey;
  incomingPartnerRequest?: IncomingPartnerRequest;
  outgoingPartnerRequest?: OutgoingPartnerRequest;
  confirmedPartner?: PartnerCandidate;
  assignedTeam?: {
    id: string;
    groupNumber: number;
    projectTopic?: string;
    members: TeamAssignmentMember[];
    leaderId?: string;
  };
  leaderConfirmation?: {
    status: 'not-confirmed' | 'confirmed' | 'conflict';
    isActionAvailable: boolean;
    unavailableReason?: string;
  };
};
export type SaveTeamAssignmentSurveyInput = {
  sectionId: string;
  survey: TeamAssignmentSurvey;
};
export type ConfirmTeamLeaderInput = { sectionId: string; teamId: string };
