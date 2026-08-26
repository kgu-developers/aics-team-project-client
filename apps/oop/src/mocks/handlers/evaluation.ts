import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import type {
  MyPeerEvaluationResponse,
  MyPresentationEvaluation,
  PeerEvaluationTeammateAnswer,
  SubmitPeerEvaluationResponseInput,
  SubmitPresentationEvaluationInput,
} from '@aics/core';
import { http, HttpResponse } from 'msw';

import {
  evaluationSectionId,
  getEvaluationMembership,
  getPeerWindowState,
  getPeerResponse,
  getPeerTargets,
  getPresentationEvaluation,
  getPresentationEvaluationOverview,
  getPresentationTeam,
  getPresentationWindowState,
  peerEvaluationFormId,
  presentationEvaluationCriteria,
  presentationEvaluationMilestoneId,
  setPeerResponse,
  upsertPresentationEvaluation,
} from '../data/evaluation';
import { getDemoUserAccount } from '../data/users';

function error(code: string, message: string, status: number) {
  return HttpResponse.json({ code, message }, { status });
}

function requireEvaluationStudent(request: Request) {
  const token =
    request.headers.get('authorization')?.replace('Bearer ', '') ?? null;
  const account = getDemoUserAccount(token);
  if (!account)
    return {
      response: error('UNAUTHORIZED', '로그인 후 평가를 확인해 주세요.', 401),
    };
  if (account.user.globalRole !== 'STUDENT')
    return {
      response: error(
        'STUDENT_ROLE_REQUIRED',
        '학생 계정만 접근할 수 있어요.',
        403,
      ),
    };

  const userId = account.user.studentNumber;
  const membership = getEvaluationMembership(userId);
  if (
    !membership ||
    !account.user.sections.some(section => section.id === membership.sectionId)
  )
    return {
      response: error(
        'EVALUATION_ACCESS_DENIED',
        '평가 대상 분반과 팀을 확인할 수 없어요.',
        403,
      ),
    };

  return { userId, ...membership };
}

function requireSectionScope(
  student: { sectionId: string },
  sectionId: string,
) {
  if (student.sectionId !== sectionId)
    return error(
      'SECTION_ACCESS_DENIED',
      '다른 분반의 평가에는 접근할 수 없어요.',
      403,
    );
  if (sectionId !== evaluationSectionId)
    return error('SECTION_NOT_FOUND', '평가 분반을 찾을 수 없어요.', 404);
  return null;
}

function requireEvaluationResourceScope(student: { sectionId: string }) {
  return student.sectionId === evaluationSectionId
    ? null
    : error(
        'EVALUATION_ACCESS_DENIED',
        '다른 분반의 평가 리소스에는 접근할 수 없어요.',
        403,
      );
}

async function parseBody<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isPresentationInput(
  value: unknown,
): value is SubmitPresentationEvaluationInput {
  return (
    isRecord(value) &&
    typeof value.rateeTeamId === 'string' &&
    typeof value.submit === 'boolean' &&
    Array.isArray(value.scores) &&
    value.scores.every(
      score =>
        isRecord(score) &&
        typeof score.criterionId === 'string' &&
        typeof score.score === 'number',
    )
  );
}

function isPeerInput(
  value: unknown,
): value is SubmitPeerEvaluationResponseInput {
  return (
    isRecord(value) &&
    typeof value.selfContribution === 'string' &&
    typeof value.projectReviewComment === 'string' &&
    typeof value.submit === 'boolean' &&
    Array.isArray(value.answers) &&
    value.answers.every(answer => {
      if (!isRecord(answer) || typeof answer.kind !== 'string') return false;
      if (answer.kind === 'REFLECTION')
        return typeof answer.comment === 'string';
      return (
        answer.kind === 'TEAMMATE_CONTRIBUTION' &&
        typeof answer.targetUserId === 'string' &&
        typeof answer.contributionPercent === 'number' &&
        typeof answer.contributionDetail === 'string' &&
        typeof answer.teammateAssessment === 'string'
      );
    })
  );
}

export const evaluationHandlers = [
  http.get(
    `${API_BASE_URL}${ENDPOINTS.EVALUATION.CONTEXT(':sectionId')}`,
    ({ params, request }) => {
      const student = requireEvaluationStudent(request);
      if ('response' in student) return student.response;
      const scopeError = requireSectionScope(student, String(params.sectionId));
      if (scopeError) return scopeError;
      return HttpResponse.json({
        presentationMilestoneId: presentationEvaluationMilestoneId,
        peerEvaluationFormId,
      });
    },
  ),
  http.get(
    `${API_BASE_URL}${ENDPOINTS.EVALUATION.TEAM_CRITERIA(':sectionId')}`,
    ({ params, request }) => {
      const student = requireEvaluationStudent(request);
      if ('response' in student) return student.response;
      const scopeError = requireSectionScope(student, String(params.sectionId));
      if (scopeError) return scopeError;
      return HttpResponse.json(presentationEvaluationCriteria);
    },
  ),
  http.get(
    `${API_BASE_URL}${ENDPOINTS.EVALUATION.MY_TEAM_EVALUATIONS(':milestoneId')}`,
    ({ params, request }) => {
      const student = requireEvaluationStudent(request);
      if ('response' in student) return student.response;
      const scopeError = requireEvaluationResourceScope(student);
      if (scopeError) return scopeError;
      if (params.milestoneId !== presentationEvaluationMilestoneId)
        return error(
          'MILESTONE_NOT_FOUND',
          '발표 평가 일정을 찾을 수 없어요.',
          404,
        );
      return HttpResponse.json(
        getPresentationEvaluationOverview(student.userId),
      );
    },
  ),
  http.post(
    `${API_BASE_URL}${ENDPOINTS.EVALUATION.TEAM_EVALUATIONS(':milestoneId')}`,
    async ({ params, request }) => {
      const student = requireEvaluationStudent(request);
      if ('response' in student) return student.response;
      const scopeError = requireEvaluationResourceScope(student);
      if (scopeError) return scopeError;
      if (params.milestoneId !== presentationEvaluationMilestoneId)
        return error(
          'MILESTONE_NOT_FOUND',
          '발표 평가 일정을 찾을 수 없어요.',
          404,
        );
      const windowState = getPresentationWindowState();
      if (windowState === 'UPCOMING')
        return error(
          'EVALUATION_NOT_OPEN',
          '발표 평가가 아직 시작되지 않았어요.',
          403,
        );
      if (windowState === 'NOT_CONFIGURED')
        return error(
          'EVALUATION_NOT_CONFIGURED',
          '발표 평가 시작 시간이 설정되지 않았어요.',
          403,
        );
      const input = await parseBody<unknown>(request);
      if (!isPresentationInput(input))
        return error(
          'INVALID_REQUEST',
          '발표 평가 요청 형식이 올바르지 않아요.',
          400,
        );
      const team = getPresentationTeam(input.rateeTeamId);
      if (!team)
        return error('TARGET_NOT_FOUND', '평가 대상 팀을 찾을 수 없어요.', 404);
      if (input.rateeTeamId === student.teamId)
        return error(
          'OWN_TEAM_NOT_ALLOWED',
          '자신의 팀 발표는 평가할 수 없어요.',
          422,
        );
      const existing = getPresentationEvaluation(
        student.userId,
        input.rateeTeamId,
      );
      if (existing?.status === 'SUBMITTED')
        return error(
          'ALREADY_SUBMITTED',
          '이미 제출한 팀 평가는 수정할 수 없어요.',
          409,
        );
      const knownCriteria = new Set(
        presentationEvaluationCriteria.map(item => item.id),
      );
      const uniqueCriteria = new Set(
        input.scores.map(item => item.criterionId),
      );
      const hasInvalidScore = input.scores.some(
        item =>
          !knownCriteria.has(item.criterionId) ||
          !Number.isInteger(item.score) ||
          item.score < 1 ||
          item.score > 5,
      );
      if (hasInvalidScore || uniqueCriteria.size !== input.scores.length)
        return error(
          'INVALID_SCORE',
          '각 평가 항목은 1점부터 5점까지 한 번씩 입력해 주세요.',
          422,
        );
      if (
        input.submit &&
        uniqueCriteria.size !== presentationEvaluationCriteria.length
      )
        return error(
          'INCOMPLETE_EVALUATION',
          '모든 발표 평가 항목의 점수를 선택해 주세요.',
          422,
        );
      const now = new Date().toISOString();
      const evaluation: MyPresentationEvaluation = {
        id:
          existing?.id ??
          `team-evaluation-${student.userId}-${input.rateeTeamId}`,
        rateeTeamId: input.rateeTeamId,
        scores: input.scores,
        status: input.submit ? 'SUBMITTED' : 'DRAFT',
        updatedAt: now,
        submittedAt: input.submit ? now : undefined,
      };
      upsertPresentationEvaluation(student.userId, evaluation);
      return HttpResponse.json(evaluation);
    },
  ),
  http.get(
    `${API_BASE_URL}${ENDPOINTS.EVALUATION.PEER_TARGETS(':formId')}`,
    ({ params, request }) => {
      const student = requireEvaluationStudent(request);
      if ('response' in student) return student.response;
      const scopeError = requireEvaluationResourceScope(student);
      if (scopeError) return scopeError;
      if (params.formId !== peerEvaluationFormId)
        return error('FORM_NOT_FOUND', '상호평가 폼을 찾을 수 없어요.', 404);
      return HttpResponse.json({
        formId: peerEvaluationFormId,
        title: '팀 기여도 평가 및 개인보고서',
        windowState: getPeerWindowState(),
        windowMessage:
          getPeerWindowState() === 'OPEN'
            ? '본인을 제외한 팀원에게 기여도 합계 100%를 배분해 주세요.'
            : '상호평가 기간이 종료됐어요. 내 제출 내역만 확인할 수 있어요.',
        targets: getPeerTargets(student.userId),
        myResponse: getPeerResponse(student.userId),
      });
    },
  ),
  http.post(
    `${API_BASE_URL}${ENDPOINTS.EVALUATION.PEER_RESPONSES(':formId')}`,
    async ({ params, request }) => {
      const student = requireEvaluationStudent(request);
      if ('response' in student) return student.response;
      const scopeError = requireEvaluationResourceScope(student);
      if (scopeError) return scopeError;
      if (params.formId !== peerEvaluationFormId)
        return error('FORM_NOT_FOUND', '상호평가 폼을 찾을 수 없어요.', 404);
      if (getPeerWindowState() !== 'OPEN')
        return error('EVALUATION_CLOSED', '상호평가 기간이 종료됐어요.', 403);
      const input = await parseBody<unknown>(request);
      if (!isPeerInput(input))
        return error(
          'INVALID_REQUEST',
          '상호평가 요청 형식이 올바르지 않아요.',
          400,
        );
      const existing = getPeerResponse(student.userId);
      if (existing?.status === 'SUBMITTED')
        return error(
          'ALREADY_SUBMITTED',
          '이미 제출한 상호평가는 수정할 수 없어요.',
          409,
        );
      const targets = getPeerTargets(student.userId);
      const targetIds = new Set(targets.map(target => target.userId));
      const teammateAnswers = input.answers.filter(
        (answer): answer is PeerEvaluationTeammateAnswer =>
          answer.kind === 'TEAMMATE_CONTRIBUTION',
      );
      const uniqueTargetIds = new Set(
        teammateAnswers.map(answer => answer.targetUserId),
      );
      if (
        teammateAnswers.some(
          answer =>
            !targetIds.has(answer.targetUserId) ||
            answer.targetUserId === student.userId ||
            !Number.isInteger(answer.contributionPercent) ||
            answer.contributionPercent < 0 ||
            answer.contributionPercent > 100,
        ) ||
        uniqueTargetIds.size !== teammateAnswers.length
      )
        return error(
          'INVALID_TARGET',
          '본인을 제외한 현재 팀원만 평가할 수 있어요.',
          422,
        );
      const total = teammateAnswers.reduce(
        (sum, answer) => sum + answer.contributionPercent,
        0,
      );
      if (input.submit && total !== 100)
        return error(
          'CONTRIBUTION_SUM_INVALID',
          '팀원 기여도 합계는 100%여야 해요.',
          422,
        );
      const reflections = input.answers.filter(
        answer => answer.kind === 'REFLECTION',
      );
      if (reflections.length !== 1)
        return error(
          'INVALID_REFLECTION',
          '소감 응답은 하나만 작성해 주세요.',
          422,
        );
      const reflection = reflections[0];
      if (
        input.submit &&
        (uniqueTargetIds.size !== targets.length ||
          !input.selfContribution.trim() ||
          !input.projectReviewComment.trim() ||
          !reflection ||
          !reflection.comment.trim() ||
          teammateAnswers.some(
            answer =>
              !answer.contributionDetail.trim() ||
              !answer.teammateAssessment.trim(),
          ))
      )
        return error(
          'INCOMPLETE_RESPONSE',
          '모든 개인보고서와 팀원 평가 항목을 작성해 주세요.',
          422,
        );
      const now = new Date().toISOString();
      const { submit, ...responseInput } = input;
      const response: MyPeerEvaluationResponse = {
        id: existing?.id ?? `peer-response-${student.userId}`,
        ...responseInput,
        status: submit ? 'SUBMITTED' : 'DRAFT',
        updatedAt: now,
        submittedAt: submit ? now : undefined,
      };
      setPeerResponse(student.userId, response);
      return HttpResponse.json(response);
    },
  ),
];
