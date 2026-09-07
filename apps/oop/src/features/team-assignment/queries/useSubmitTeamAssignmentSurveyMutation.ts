import { submitTeamAssignmentSurvey } from '@aics/api-client';
import type { SubmitTeamAssignmentSurveyInput } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  teamAssignmentQueryKey,
  teamAssignmentSurveyQueryKey,
} from './teamAssignmentKeys';

export function useSubmitTeamAssignmentSurveyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      input: SubmitTeamAssignmentSurveyInput & {
        projectionSectionId?: string;
      },
    ) =>
      submitTeamAssignmentSurvey({
        sectionId: input.sectionId,
        survey: input.survey,
      }),
    onSuccess: (survey, input) => {
      queryClient.setQueryData(
        teamAssignmentSurveyQueryKey(input.sectionId),
        survey,
      );

      if (input.projectionSectionId) {
        return queryClient.invalidateQueries({
          queryKey: teamAssignmentQueryKey(input.projectionSectionId),
        });
      }
    },
  });
}
