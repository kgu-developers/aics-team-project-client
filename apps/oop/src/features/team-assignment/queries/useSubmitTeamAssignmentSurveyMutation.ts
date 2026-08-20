import { submitTeamAssignmentSurvey } from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { teamAssignmentQueryKey } from './teamAssignmentKeys';

export function useSubmitTeamAssignmentSurveyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitTeamAssignmentSurvey,
    onSuccess: (_projection, input) =>
      queryClient.invalidateQueries({
        queryKey: teamAssignmentQueryKey(input.sectionId),
      }),
  });
}
