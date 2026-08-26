export type EvaluationWindowState =
  'UPCOMING' | 'OPEN' | 'CLOSED' | 'NOT_CONFIGURED';

export type EvaluationContext = {
  presentationMilestoneId?: string;
  peerEvaluationFormId?: string;
};

export type PresentationEvaluationCriterion = {
  id: string;
  title: string;
  description: string;
  minScore: 1;
  maxScore: 5;
};

export type PresentationEvaluationScore = {
  criterionId: string;
  score: number;
};

export type PresentationEvaluationStatus = 'DRAFT' | 'SUBMITTED';
export type PresentationTeamProgress = 'COMPLETED' | 'CURRENT' | 'UPCOMING';

export type PresentationEvaluationMaterial = {
  artifactId: string;
  fileName: string;
  fileUrl: string;
  mimeType: 'application/pdf';
  submittedAt: string;
  previewPages: Array<{
    id: string;
    pageNumber: number;
    imageUrl: string;
    alt: string;
  }>;
};

export type PresentationEvaluationFeature = {
  id: string;
  name: string;
  description: string;
};

export type PresentationEvaluationScreen = {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
};

export type PresentationEvaluationTeam = {
  id: string;
  name: string;
  order: number;
  scheduledAt: string;
  progress: PresentationTeamProgress;
  isMyTeam: boolean;
  presentation: {
    projectTitle: string;
    projectIntroduction: string;
    submittedMaterial: PresentationEvaluationMaterial;
    mainScreens: PresentationEvaluationScreen[];
    mainFeatures: PresentationEvaluationFeature[];
    demoVideoUrl?: string;
    demoFlow: string[];
  };
};

export type MyPresentationEvaluation = {
  id: string;
  rateeTeamId: string;
  scores: PresentationEvaluationScore[];
  status: PresentationEvaluationStatus;
  updatedAt: string;
  submittedAt?: string;
};

export type PresentationEvaluationOverview = {
  milestoneId: string;
  evaluationOpensAt: string;
  evaluationClosesAt: string;
  windowState: EvaluationWindowState;
  windowMessage: string;
  teams: PresentationEvaluationTeam[];
  myEvaluations: MyPresentationEvaluation[];
};

export type SubmitPresentationEvaluationInput = {
  rateeTeamId: string;
  scores: PresentationEvaluationScore[];
  submit: boolean;
};

export type PeerEvaluationTarget = {
  userId: string;
  name: string;
  role: string;
};

export type PeerEvaluationTeammateAnswer = {
  kind: 'TEAMMATE_CONTRIBUTION';
  targetUserId: string;
  contributionPercent: number;
  contributionDetail: string;
  teammateAssessment: string;
};

export type PeerEvaluationReflectionAnswer = {
  kind: 'REFLECTION';
  comment: string;
};

export type PeerEvaluationAnswer =
  PeerEvaluationTeammateAnswer | PeerEvaluationReflectionAnswer;

export type SubmitPeerEvaluationResponseInput = {
  selfContribution: string;
  projectReviewComment: string;
  answers: PeerEvaluationAnswer[];
  submit: boolean;
};

export type MyPeerEvaluationResponse = Omit<
  SubmitPeerEvaluationResponseInput,
  'submit'
> & {
  id: string;
  status: PresentationEvaluationStatus;
  updatedAt: string;
  submittedAt?: string;
};

export type PeerEvaluationTargets = {
  formId: string;
  title: string;
  windowState: EvaluationWindowState;
  windowMessage: string;
  targets: PeerEvaluationTarget[];
  myResponse?: MyPeerEvaluationResponse;
};
