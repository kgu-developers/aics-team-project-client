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
