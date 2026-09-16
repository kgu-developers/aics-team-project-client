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

export type PreSurveyClassmate = {
  userId: string;
  name: string;
};

export type PreSurveyClassmateListResponse = {
  contents: PreSurveyClassmate[];
};

export type PreferredPeerRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export type ReceivedPreferredPeerRequest = {
  requesterUserId: string;
  requesterName: string;
  status: PreferredPeerRequestStatus;
};

export type ReceivedPreferredPeerRequestListResponse = {
  contents: ReceivedPreferredPeerRequest[];
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
    name?: string;
    groupNumber?: number;
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

export type SubmitPreSurveyResponseRequest = {
  preferredRoles: string[];
  topicOpinion?: string;
  etcOpinion?: string;
  preferredPeerUserId?: string | null;
};

export type PreSurveyResponseDetailResponse = {
  id: number;
  sectionId: number;
  userId: string;
  preferredRoles: unknown;
  submittedAt: string;
  userName?: string;
  topicOpinion?: string;
  etcOpinion?: string;
  preferredPeerUserId?: string | null;
  preferredPeerStatus?: PreferredPeerRequestStatus | null;
};

export type SubmitTeamAssignmentSurveyInput = {
  sectionId: number;
  survey: TeamAssignmentSurvey;
  preferredPeerUserId?: string | null;
};
