import type { StudentSubmissionScope } from '../submissionScope';

export const studentSubmissionKeys = {
  all: ['student-submission-api'] as const,
  scope: (scope: StudentSubmissionScope) =>
    [
      'student-submission-api',
      scope.sectionId,
      scope.teamId,
      scope.studentNumber,
      scope.milestoneId,
    ] as const,
  detail: (scope: StudentSubmissionScope, submissionId?: string) =>
    [...studentSubmissionKeys.scope(scope), 'detail', submissionId] as const,
  versions: (scope: StudentSubmissionScope, submissionId?: string) =>
    [...studentSubmissionKeys.scope(scope), 'versions', submissionId] as const,
  version: (
    scope: StudentSubmissionScope,
    submissionId?: string,
    version?: number,
  ) =>
    [
      ...studentSubmissionKeys.scope(scope),
      'version',
      submissionId,
      version,
    ] as const,
};
