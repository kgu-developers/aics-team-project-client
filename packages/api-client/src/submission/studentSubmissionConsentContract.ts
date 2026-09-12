import type { StudentSubmissionMemberConsent } from '@aics/core';

export function validateStudentSubmissionConsent(
  value: unknown,
): asserts value is StudentSubmissionMemberConsent {
  if (
    !value ||
    typeof value !== 'object' ||
    !('confirmedCount' in value) ||
    !('totalCount' in value) ||
    !('isConfirmedByMe' in value) ||
    typeof value.confirmedCount !== 'number' ||
    typeof value.totalCount !== 'number' ||
    !Number.isInteger(value.confirmedCount) ||
    !Number.isInteger(value.totalCount) ||
    value.confirmedCount < 0 ||
    value.totalCount < value.confirmedCount ||
    value.totalCount > 2_147_483_647 ||
    typeof value.isConfirmedByMe !== 'boolean' ||
    (value.isConfirmedByMe && value.confirmedCount === 0)
  )
    throw new Error('팀원 확인 현황 응답을 확인할 수 없습니다.');
}
