import type { StudentSubmissionResponse } from '@aics/core';

export type StudentSubmissionScope = {
  sectionId?: string;
  teamId?: string;
  milestoneId?: string;
  studentNumber?: string;
};
export function hasSubmissionApiId(value: string | undefined): value is string {
  return Boolean(
    value && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value)),
  );
}
export function hasSubmissionScope(scope: StudentSubmissionScope) {
  return (
    hasSubmissionApiId(scope.sectionId) &&
    hasSubmissionApiId(scope.teamId) &&
    hasSubmissionApiId(scope.milestoneId) &&
    Boolean(
      scope.studentNumber?.trim() &&
      scope.studentNumber.trim() === scope.studentNumber,
    )
  );
}
export function requireMatchingSubmission(
  data: StudentSubmissionResponse,
  scope: StudentSubmissionScope,
) {
  if (
    String(data.teamId) !== scope.teamId ||
    String(data.milestoneId) !== scope.milestoneId
  )
    throw new Error('현재 팀과 마일스톤의 제출 자료인지 확인할 수 없습니다.');
  return data;
}
