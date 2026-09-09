import type {
  StudentSubmissionResponse,
  StudentSubmissionVersionResponse,
  StudentSubmissionVersionsResponse,
} from '@aics/core';

export function validateStudentSubmissionId(id: string) {
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id)))
    throw new Error('유효한 제출 대상 식별자가 필요합니다.');
}
export function validateStudentSubmissionVersionNumber(version: number) {
  if (!Number.isSafeInteger(version) || version <= 0 || version > 2_147_483_647)
    throw new Error('유효한 제출 버전이 필요합니다.');
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
function natural(value: unknown, minimum = 0) {
  return (
    typeof value === 'number' && Number.isSafeInteger(value) && value >= minimum
  );
}
function optionalString(value: unknown) {
  return value == null || typeof value === 'string';
}
function optionalNatural(value: unknown, minimum = 0) {
  return value == null || natural(value, minimum);
}
const statuses = [
  'NOT_SUBMITTED',
  'SUBMITTED',
  'APPROVED',
  'FEEDBACK_PROVIDED',
  'REVISION_REQUESTED',
  'COMPLETED',
];

export function validateStudentSubmission(
  value: unknown,
): asserts value is StudentSubmissionResponse {
  if (
    !record(value) ||
    !natural(value.id, 1) ||
    !natural(value.milestoneId, 1) ||
    !natural(value.teamId, 1) ||
    !natural(value.currentVersion) ||
    typeof value.status !== 'string' ||
    !statuses.includes(value.status) ||
    typeof value.canSubmitNow !== 'boolean' ||
    typeof value.hasPendingReview !== 'boolean' ||
    !optionalNatural(value.presentationOrder) ||
    !optionalString(value.completedAt) ||
    !optionalString(value.completedBy)
  )
    throw new Error('제출 상태 응답을 확인할 수 없습니다.');
  const consent = value.memberConsent;
  if (
    consent != null &&
    (!record(consent) ||
      !natural(consent.confirmedCount) ||
      !natural(consent.totalCount) ||
      Number(consent.confirmedCount) > Number(consent.totalCount) ||
      typeof consent.isConfirmedByMe !== 'boolean')
  )
    throw new Error('팀원 확인 현황을 확인할 수 없습니다.');
}
export function validateStudentSubmissionVersion(
  value: unknown,
  expectedVersion?: number,
): asserts value is StudentSubmissionVersionResponse {
  if (
    !record(value) ||
    !natural(value.id, 1) ||
    !natural(value.version, 1) ||
    (expectedVersion !== undefined && value.version !== expectedVersion) ||
    !record(value.submittedBy) ||
    typeof value.submittedBy.userId !== 'string' ||
    !value.submittedBy.userId ||
    typeof value.submittedBy.name !== 'string' ||
    typeof value.submittedAt !== 'string' ||
    typeof value.updatedAt !== 'string' ||
    typeof value.late !== 'boolean' ||
    !Array.isArray(value.artifacts) ||
    !optionalString(value.description) ||
    !optionalString(value.changeNote)
  )
    throw new Error('제출 버전 응답을 확인할 수 없습니다.');
  for (const artifact of value.artifacts) {
    if (
      !record(artifact) ||
      typeof artifact.type !== 'string' ||
      !['FILE', 'LINK', 'TEXT', 'CHEERPJ_RUN'].includes(artifact.type) ||
      !optionalNatural(artifact.requiredArtifactId, 1) ||
      !optionalNatural(artifact.fileId, 1) ||
      !optionalNatural(artifact.size) ||
      !['fileName', 'mimeType', 'downloadUrl', 'url', 'content'].every(key =>
        optionalString(artifact[key]),
      )
    )
      throw new Error('제출 파일 응답을 확인할 수 없습니다.');
  }
}
export function validateStudentSubmissionVersions(
  value: unknown,
): asserts value is StudentSubmissionVersionsResponse {
  if (!record(value) || !Array.isArray(value.contents))
    throw new Error('제출 이력을 확인할 수 없습니다.');
  const versions = new Set<number>();
  for (const version of value.contents) {
    validateStudentSubmissionVersion(version);
    if (versions.has(version.version))
      throw new Error('제출 이력에 중복된 버전이 있습니다.');
    versions.add(version.version);
  }
}
