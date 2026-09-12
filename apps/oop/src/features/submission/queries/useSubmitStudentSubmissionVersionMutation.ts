import { submitStudentSubmissionVersion } from '@aics/api-client';
import type { StudentSubmissionVersionInput } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  selectHasAuthenticatedSession,
  useAuthStore,
} from '~/features/auth/authStore';
import { studentHomeKeys } from '~/features/student-home/queries/studentHomeKeys';

import {
  hasSubmissionApiId,
  hasSubmissionScope,
  requireMatchingSubmission,
  type StudentSubmissionScope,
} from '../submissionScope';
import { studentSubmissionKeys } from './studentSubmissionKeys';

export function useSubmitStudentSubmissionVersionMutation(
  scope: StudentSubmissionScope,
  submissionId: string,
) {
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: async (input: StudentSubmissionVersionInput) => {
      const before = useAuthStore.getState();
      if (
        !hasSubmissionScope(scope) ||
        !hasSubmissionApiId(submissionId) ||
        !selectHasAuthenticatedSession(before) ||
        before.currentUser?.studentNumber !== scope.studentNumber
      )
        throw new Error('로그인과 제출 대상을 다시 확인해 주세요.');
      const result = requireMatchingSubmission(
        await submitStudentSubmissionVersion(submissionId, input),
        scope,
      );
      const after = useAuthStore.getState();
      if (
        before.currentUser !== after.currentUser ||
        !selectHasAuthenticatedSession(after)
      )
        throw new Error(
          '세션이 변경됐어요. 다시 로그인한 뒤 제출 내역을 확인해 주세요.',
        );
      // Cancel older reads before publishing the newer submission state.
      await client.cancelQueries({
        queryKey: studentSubmissionKeys.scope(scope),
      });
      if (useAuthStore.getState().currentUser !== before.currentUser)
        throw new Error('세션이 변경됐어요.');
      client.setQueryData(
        studentSubmissionKeys.detail(scope, submissionId),
        result,
      );
      client.setQueryData(
        studentHomeKeys.submission(
          scope.sectionId,
          scope.teamId,
          Number(scope.milestoneId),
        ),
        result,
      );
      void client.invalidateQueries({
        queryKey: studentSubmissionKeys.versions(scope, submissionId),
      });
      return result;
    },
  });
}
