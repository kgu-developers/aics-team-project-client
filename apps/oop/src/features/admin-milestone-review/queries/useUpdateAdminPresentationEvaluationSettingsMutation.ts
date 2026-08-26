import {
  updateAdminPresentationEvaluationSettings,
  type UpdateAdminPresentationEvaluationSettingsInput,
} from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminPresentationEvaluationKeys } from './adminPresentationEvaluationKeys';

export function useUpdateAdminPresentationEvaluationSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateAdminPresentationEvaluationSettingsInput) =>
      updateAdminPresentationEvaluationSettings(input),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({
        queryKey: adminPresentationEvaluationKeys.list(variables.sectionId),
      }),
  });
}
