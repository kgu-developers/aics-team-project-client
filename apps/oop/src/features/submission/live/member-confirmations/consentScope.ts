import type { StudentSubmissionResponse } from '@aics/core';
import { isAxiosError } from 'axios';

import {
  hasSubmissionApiId,
  hasSubmissionScope,
  requireMatchingSubmission,
  type StudentSubmissionScope,
} from '../submissionScope';

export type SubmissionConsentScope = StudentSubmissionScope & {
  submissionId?: string;
  currentVersion?: number;
  milestoneType?: string;
};
export class SubmissionConsentContextError extends Error {
  constructor(
    public readonly reason: 'version-changed' | 'unsupported',
    public readonly currentVersion?: number,
  ) {
    super(reason);
  }
}
export function hasConsentScope(scope: SubmissionConsentScope) {
  return (
    hasSubmissionScope(scope) &&
    hasSubmissionApiId(scope.submissionId) &&
    scope.currentVersion !== undefined &&
    Number.isInteger(scope.currentVersion) &&
    scope.currentVersion >= 0 &&
    scope.currentVersion <= 2_147_483_647
  );
}
export function requireMatchingConsentSubmission(
  submission: StudentSubmissionResponse,
  scope: SubmissionConsentScope,
) {
  requireMatchingSubmission(submission, scope);
  if (String(submission.id) !== scope.submissionId)
    throw new Error('제출 대상을 확인할 수 없습니다.');
  if (submission.currentVersion !== scope.currentVersion)
    throw new SubmissionConsentContextError(
      'version-changed',
      submission.currentVersion,
    );
  if (!submission.memberConsent)
    throw new SubmissionConsentContextError('unsupported');
  return submission;
}
export function submissionConsentErrorMessage(error: unknown) {
  if (error instanceof SubmissionConsentContextError)
    return error.reason === 'version-changed'
      ? `현재 제출은 v${error.currentVersion}이에요. 새 제출 자료를 확인한 뒤 다시 진행해 주세요.`
      : '최종보고서의 팀원 확인만 지원해요.';
  if (isAxiosError(error)) {
    if (error.response?.status === 401)
      return '로그인 정보가 만료되었어요. 다시 로그인해 주세요.';
    if (error.response?.status === 403)
      return '이 제출을 확인할 권한이 없어요. 현재 팀과 수강 상태를 확인해 주세요.';
    if (error.response?.status === 404)
      return '제출 자료를 찾을 수 없어요. 제출 대상을 다시 확인해 주세요.';
    if (
      error.response?.data?.code ===
      'SUBMISSION_MEMBER_CONFIRMATION_NOT_APPLICABLE'
    )
      return '최종보고서의 팀원 확인만 지원해요.';
  }
  return '팀원 확인 현황을 처리하지 못했어요. 다시 시도해 주세요.';
}
