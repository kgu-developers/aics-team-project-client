import { fetchStudentSubmission } from '@aics/api-client';
import type { MyTeamMilestoneSubmissionResponse } from '@aics/core';
import { skipToken, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { studentHomeKeys } from '~/features/student-home/queries/studentHomeKeys';

import { studentSubmissionKeys } from './studentSubmissionKeys';
import {
  hasSubmissionApiId,
  hasSubmissionScope,
  requireMatchingSubmission,
  type StudentSubmissionScope,
} from '../submissionScope';

export function useStudentSubmissionQuery(
  scope: StudentSubmissionScope,
  submissionId?: string,
) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: studentSubmissionKeys.detail(scope, submissionId),
    queryFn:
      hasSubmissionScope(scope) && hasSubmissionApiId(submissionId)
        ? async () =>
            requireMatchingSubmission(
              await fetchStudentSubmission(submissionId),
              scope,
            )
        : skipToken,
    retry: false,
  });
  const { sectionId, teamId, milestoneId } = scope;
  useEffect(() => {
    if (!query.isSuccess || !query.data) return;
    const key = [
      ...studentHomeKeys.all,
      'submission',
      sectionId,
      teamId,
      Number(milestoneId),
    ];
    // Reuse the existing home summary without repeating its get-or-create GET.
    if (
      (client.getQueryState(key)?.dataUpdatedAt ?? Infinity) >
      query.dataUpdatedAt
    )
      return;
    client.setQueryData<MyTeamMilestoneSubmissionResponse>(key, previous =>
      previous?.id === query.data.id ? query.data : previous,
    );
  }, [
    client,
    query.data,
    query.dataUpdatedAt,
    query.isSuccess,
    sectionId,
    teamId,
    milestoneId,
  ]);
  return query;
}
