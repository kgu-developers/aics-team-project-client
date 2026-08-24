import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import type {
  Submission,
  SubmissionArtifactRule,
  SubmitSubmissionVersionInput,
} from '@aics/core';
import { http, HttpResponse } from 'msw';

import { isEditLockHeldByOther } from './editLock';
import {
  getCurrentPresentation,
  isPresentationSubmitted,
  markPresentationMaterialChanged,
} from '../data/presentation';
import {
  demoSubmissionSectionId,
  demoSubmissionTeamId,
  getSubmissionById,
  getSubmissionByMilestone,
  submitMockSubmissionVersion,
} from '../data/submission';
import { getDemoUserAccount } from '../data/users';

type GuardResult =
  { response: Response } | { userId: string; userName: string; teamId: string };

function errorResponse(code: string, message: string, status: number) {
  return HttpResponse.json({ code, message }, { status });
}

function getAccessToken(request: Request) {
  return request.headers.get('authorization')?.replace('Bearer ', '') ?? null;
}

function guard(request: Request): GuardResult {
  const account = getDemoUserAccount(getAccessToken(request));
  if (!account) {
    return {
      response: errorResponse(
        'UNAUTHORIZED',
        '로그인 후 제출물을 확인해 주세요.',
        401,
      ),
    };
  }
  if (account.user.globalRole !== 'STUDENT') {
    return {
      response: errorResponse(
        'STUDENT_ROLE_REQUIRED',
        '학생 계정만 팀 제출물에 접근할 수 있어요.',
        403,
      ),
    };
  }
  if (
    !account.user.sections.some(
      section => section.id === demoSubmissionSectionId,
    )
  ) {
    return {
      response: errorResponse(
        'SECTION_ACCESS_DENIED',
        '이 제출물이 속한 분반에 접근할 수 없어요.',
        403,
      ),
    };
  }

  const userId =
    account.user.studentNumber === '20260001'
      ? 'student-a'
      : account.user.studentNumber === '20260003'
        ? 'student-b'
        : 'student-c';
  return {
    userId,
    userName: account.user.name,
    teamId: demoSubmissionTeamId,
  };
}

function requireTeamScope(result: GuardResult, submission: Submission) {
  if ('response' in result) return result.response;
  if (submission.teamId !== result.teamId) {
    return errorResponse(
      'TEAM_ACCESS_DENIED',
      '다른 팀의 제출물에는 접근할 수 없어요.',
      403,
    );
  }
  return null;
}

function extensionOf(fileName: string) {
  return fileName.split('.').pop()?.toLowerCase() ?? '';
}

function isArtifactInput(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

function validateArtifacts(input: unknown, rules: SubmissionArtifactRule[]) {
  if (
    !input ||
    typeof input !== 'object' ||
    !('artifacts' in input) ||
    !Array.isArray(input.artifacts)
  ) {
    return errorResponse(
      'ARTIFACTS_REQUIRED',
      '필수 제출 파일을 모두 선택해 주세요.',
      400,
    );
  }

  const remaining = [...input.artifacts];
  for (const rule of rules) {
    const index = remaining.findIndex(
      artifact =>
        isArtifactInput(artifact) &&
        typeof artifact.name === 'string' &&
        rule.allowedExtensions.includes(extensionOf(artifact.name)),
    );
    if (index < 0) {
      return errorResponse(
        'REQUIRED_ARTIFACT_MISSING',
        `${rule.label} 파일이 필요해요.`,
        400,
      );
    }
    const [artifact] = remaining.splice(index, 1);
    if (
      !isArtifactInput(artifact) ||
      artifact.kind !== 'FILE' ||
      typeof artifact.name !== 'string' ||
      typeof artifact.size !== 'number' ||
      artifact.size <= 0
    ) {
      return errorResponse(
        'INVALID_ARTIFACT',
        `${rule.label} 파일 정보가 올바르지 않아요.`,
        400,
      );
    }
    if (artifact.size > rule.maxSize) {
      return errorResponse(
        'ARTIFACT_TOO_LARGE',
        `${rule.label} 파일 크기 제한을 초과했어요.`,
        413,
      );
    }
  }
  if (remaining.length > 0) {
    return errorResponse(
      'ARTIFACT_TYPE_NOT_ALLOWED',
      '허용되지 않은 형식의 파일이 포함되어 있어요.',
      400,
    );
  }
  return null;
}

export const submissionHandlers = [
  http.get(
    `${API_BASE_URL}${ENDPOINTS.SUBMISSION.MY_TEAM_BY_MILESTONE(':milestoneId')}`,
    ({ params, request }) => {
      const result = guard(request);
      if ('response' in result) return result.response;
      const submission = getSubmissionByMilestone(
        result.teamId,
        String(params.milestoneId),
      );
      if (!submission) {
        return errorResponse(
          'SUBMISSION_NOT_FOUND',
          '제출 대상을 찾을 수 없어요.',
          404,
        );
      }
      const scopeError = requireTeamScope(result, submission);
      return scopeError ?? HttpResponse.json(submission);
    },
  ),
  http.get(
    `${API_BASE_URL}${ENDPOINTS.SUBMISSION.DETAIL(':submissionId')}`,
    ({ params, request }) => {
      const result = guard(request);
      if ('response' in result) return result.response;
      const submission = getSubmissionById(String(params.submissionId));
      if (!submission) {
        return errorResponse(
          'SUBMISSION_NOT_FOUND',
          '제출물을 찾을 수 없어요.',
          404,
        );
      }
      const scopeError = requireTeamScope(result, submission);
      return scopeError ?? HttpResponse.json(submission);
    },
  ),
  http.post(
    `${API_BASE_URL}${ENDPOINTS.SUBMISSION.VERSIONS(':submissionId')}`,
    async ({ params, request }) => {
      const result = guard(request);
      if ('response' in result) return result.response;
      const submissionId = String(params.submissionId);
      const submission = getSubmissionById(submissionId);
      if (!submission) {
        return errorResponse(
          'SUBMISSION_NOT_FOUND',
          '제출물을 찾을 수 없어요.',
          404,
        );
      }
      const scopeError = requireTeamScope(result, submission);
      if (scopeError) return scopeError;
      if (!submission.canSubmitNow) {
        return errorResponse(
          'SUBMISSION_NOT_ALLOWED',
          submission.submitDisabledReason ?? '지금은 제출할 수 없어요.',
          409,
        );
      }
      let input: unknown;
      try {
        input = await request.json();
      } catch {
        return errorResponse(
          'INVALID_REQUEST',
          '제출 요청 형식이 올바르지 않아요.',
          400,
        );
      }
      const validationError = validateArtifacts(
        input,
        submission.artifactRules,
      );
      if (validationError) return validationError;

      if (submission.milestoneKind === 'PRESENTATION') {
        if (isPresentationSubmitted()) {
          return errorResponse(
            'PRESENTATION_SUBMITTED',
            '제출한 발표 문서는 수정할 수 없어요.',
            409,
          );
        }
        const lock = isEditLockHeldByOther(
          {
            targetType: 'PRESENTATION_CONTENT_BLOCK',
            targetId: `${getCurrentPresentation().id}:presentation-material`,
          },
          result.userName,
        );
        if (lock) {
          return errorResponse(
            'BLOCK_LOCKED',
            `${lock.lockedBy}님이 이 영역을 편집 중이에요.`,
            409,
          );
        }
      }

      const submitted = submitMockSubmissionVersion(
        submissionId,
        { userId: result.userId, name: result.userName },
        input as SubmitSubmissionVersionInput,
      );
      if (submission.milestoneKind === 'PRESENTATION') {
        markPresentationMaterialChanged(result.userName);
      }
      return HttpResponse.json(submitted);
    },
  ),
];
