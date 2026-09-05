import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import type {
  Submission,
  SubmissionArtifactRule,
  SubmissionLinkRule,
  SubmitSubmissionVersionInput,
} from '@aics/core';
import { http, HttpResponse } from 'msw';

import { getMockAccessToken } from '../authSession';
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
  updateMockSubmissionConfirmation,
} from '../data/submission';
import { getDemoUserAccount } from '../data/users';

type GuardResult =
  | { response: Response }
  | {
      userId: string;
      userName: string;
      teamId: string;
      isTeamLeader: boolean;
    };

function errorResponse(code: string, message: string, status: number) {
  return HttpResponse.json({ code, message }, { status });
}

function getAccessToken(request: Request) {
  return getMockAccessToken(request);
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
    isTeamLeader: Boolean(
      account.user.currentTeam?.members.find(
        member => member.id === account.user.id,
      )?.isLeader,
    ),
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

  const hasUnexpectedArtifact = input.artifacts.some(
    artifact =>
      !isArtifactInput(artifact) ||
      (artifact.kind !== 'FILE' && artifact.kind !== 'LINK'),
  );
  if (hasUnexpectedArtifact) {
    return errorResponse(
      'ARTIFACT_TYPE_NOT_ALLOWED',
      '허용되지 않은 제출 자료가 포함되어 있어요.',
      400,
    );
  }

  const remaining = input.artifacts.filter(
    artifact => isArtifactInput(artifact) && artifact.kind === 'FILE',
  );
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

function validateLinks(input: unknown, rules: SubmissionLinkRule[]) {
  const artifacts =
    input && typeof input === 'object' && 'artifacts' in input
      ? input.artifacts
      : null;
  if (!Array.isArray(artifacts)) {
    return errorResponse(
      'ARTIFACTS_REQUIRED',
      '필수 제출 정보를 모두 입력해 주세요.',
      400,
    );
  }

  const remaining = artifacts.filter(
    artifact => isArtifactInput(artifact) && artifact.kind === 'LINK',
  );
  for (const rule of rules) {
    const index = remaining.findIndex(
      item =>
        isArtifactInput(item) &&
        item.kind === 'LINK' &&
        item.label === rule.label,
    );
    const artifact = index >= 0 ? remaining.splice(index, 1)[0] : undefined;
    if (
      !isArtifactInput(artifact) ||
      typeof artifact.url !== 'string' ||
      typeof artifact.label !== 'string'
    ) {
      return errorResponse(
        'REQUIRED_ARTIFACT_MISSING',
        `${rule.label}이 필요해요.`,
        400,
      );
    }
    try {
      const url = new URL(artifact.url);
      if (!rule.allowedProtocols.includes(url.protocol)) {
        return errorResponse(
          'INVALID_ARTIFACT',
          `${rule.label} 주소가 올바르지 않아요.`,
          400,
        );
      }
    } catch {
      return errorResponse(
        'INVALID_ARTIFACT',
        `${rule.label} 주소가 올바르지 않아요.`,
        400,
      );
    }
  }
  if (remaining.length > 0) {
    return errorResponse(
      'ARTIFACT_TYPE_NOT_ALLOWED',
      '허용되지 않은 링크가 포함되어 있어요.',
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
        result.userId,
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
      const submission = getSubmissionById(
        String(params.submissionId),
        result.userId,
      );
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
      const submission = getSubmissionById(submissionId, result.userId);
      if (!submission) {
        return errorResponse(
          'SUBMISSION_NOT_FOUND',
          '제출물을 찾을 수 없어요.',
          404,
        );
      }
      const scopeError = requireTeamScope(result, submission);
      if (scopeError) return scopeError;
      if (submission.milestoneKind === 'FINAL_REPORT' && !result.isTeamLeader) {
        return errorResponse(
          'TEAM_LEADER_REQUIRED',
          '최종보고서는 팀장만 제출할 수 있어요.',
          403,
        );
      }
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
      const linkValidationError = validateLinks(
        input,
        submission.linkRules ?? [],
      );
      if (linkValidationError) return linkValidationError;
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
  http.put(
    `${API_BASE_URL}${ENDPOINTS.SUBMISSION.CONFIRMATION(':submissionId')}`,
    ({ params, request }) => {
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
      if (submission.milestoneKind !== 'FINAL_REPORT') {
        return errorResponse(
          'CONFIRMATION_NOT_SUPPORTED',
          '최종보고서만 승인할 수 있어요.',
          400,
        );
      }
      if (result.isTeamLeader) {
        return errorResponse(
          'TEAM_MEMBER_CONFIRMATION_ONLY',
          '팀원만 최종보고서를 승인할 수 있어요.',
          403,
        );
      }
      if (!submission.currentVersion) {
        return errorResponse(
          'SUBMISSION_NOT_SUBMITTED',
          '최종보고서가 제출된 뒤 승인할 수 있어요.',
          409,
        );
      }

      return HttpResponse.json(
        updateMockSubmissionConfirmation(submissionId, result.userId, true),
      );
    },
  ),
  http.delete(
    `${API_BASE_URL}${ENDPOINTS.SUBMISSION.CONFIRMATION(':submissionId')}`,
    ({ params, request }) => {
      const result = guard(request);
      if ('response' in result) return result.response;
      const submissionId = String(params.submissionId);
      const submission = getSubmissionById(submissionId, result.userId);
      if (!submission) {
        return errorResponse(
          'SUBMISSION_NOT_FOUND',
          '제출물을 찾을 수 없어요.',
          404,
        );
      }
      const scopeError = requireTeamScope(result, submission);
      if (scopeError) return scopeError;
      if (submission.milestoneKind !== 'FINAL_REPORT') {
        return errorResponse(
          'CONFIRMATION_NOT_SUPPORTED',
          '최종보고서만 승인할 수 있어요.',
          400,
        );
      }
      if (result.isTeamLeader) {
        return errorResponse(
          'TEAM_MEMBER_CONFIRMATION_ONLY',
          '팀원만 최종보고서 승인을 취소할 수 있어요.',
          403,
        );
      }
      if (!submission.currentVersion) {
        return errorResponse(
          'SUBMISSION_NOT_SUBMITTED',
          '최종보고서가 제출된 뒤 승인을 취소할 수 있어요.',
          409,
        );
      }

      return HttpResponse.json(
        updateMockSubmissionConfirmation(submissionId, result.userId, false),
      );
    },
  ),
];
