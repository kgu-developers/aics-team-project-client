import type {
  MyPeerEvaluationResponse,
  PeerEvaluationResponseDto,
  PeerEvaluationTargets,
  PeerEvaluationTargetsResponse,
} from '@aics/core';

export function mapPeerEvaluationResponse(
  response: PeerEvaluationResponseDto,
): MyPeerEvaluationResponse {
  return {
    ...response,
    id: String(response.id),
    selfContribution: response.selfContribution ?? '',
    projectReviewComment: response.projectReviewComment ?? '',
    submittedAt: response.submittedAt ?? undefined,
    answers: response.answers.map(answer =>
      answer.kind === 'REFLECTION'
        ? { kind: answer.kind, comment: answer.comment ?? '' }
        : {
            kind: answer.kind,
            targetUserId: answer.targetUserId!,
            contributionPercent: answer.contributionPercent,
            contributionDetail: answer.contributionDetail ?? '',
            teammateAssessment: answer.teammateAssessment ?? '',
          },
    ),
  };
}

export function mapPeerEvaluationTargets(
  response: PeerEvaluationTargetsResponse,
): PeerEvaluationTargets {
  return {
    ...response,
    formId: String(response.formId),
    myResponse: response.myResponse
      ? mapPeerEvaluationResponse(response.myResponse)
      : undefined,
  };
}
