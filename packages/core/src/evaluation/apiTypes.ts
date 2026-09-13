import type {
  EvaluationWindowState,
  PeerEvaluationTarget,
  PresentationEvaluationStatus,
} from './types';

export type EvaluationContextResponse = {
  presentationMilestoneId: string | null;
  peerEvaluationFormId: string | null;
};

export type PeerEvaluationAnswerResponse = {
  kind: 'TEAMMATE_CONTRIBUTION' | 'REFLECTION';
  targetUserId: string | null;
  contributionPercent: number | null;
  contributionDetail: string | null;
  teammateAssessment: string | null;
  comment: string | null;
};

export type PeerEvaluationResponseDto = {
  id: number;
  selfContribution: string | null;
  projectReviewComment: string | null;
  answers: PeerEvaluationAnswerResponse[];
  status: PresentationEvaluationStatus;
  updatedAt: string;
  submittedAt: string | null;
};

export type PeerEvaluationTargetsResponse = {
  formId: number;
  title: string;
  windowState: Exclude<EvaluationWindowState, 'NOT_CONFIGURED'>;
  windowMessage: string;
  targets: PeerEvaluationTarget[];
  myResponse: PeerEvaluationResponseDto | null;
};

/** Swagger: GET /milestones/{milestoneId}/team-evaluations/me */
export type TeamEvaluationCriterionDto = {
  id: number;
  title: string;
  maxScore: number;
  displayOrder: number;
};
export type TeamEvaluationScoreDto = {
  criterionId: number;
  score: number;
};
export type TeamEvaluationDto = {
  id: number;
  teamId: number;
  scores: TeamEvaluationScoreDto[];
  submittedAt?: string | null;
};
export type MyTeamEvaluationsResponse = {
  milestoneId: number;
  criteria: TeamEvaluationCriterionDto[];
  evaluations: TeamEvaluationDto[];
  evaluationOpensAt?: string | null;
  evaluationClosesAt?: string | null;
  windowState: 'UNAVAILABLE' | 'UPCOMING' | 'OPEN' | 'CLOSED';
};
/** Swagger: PUT /milestones/{milestoneId}/team-evaluations/{teamId} */
export type SubmitTeamEvaluationInput = {
  scores: TeamEvaluationScoreDto[];
};
