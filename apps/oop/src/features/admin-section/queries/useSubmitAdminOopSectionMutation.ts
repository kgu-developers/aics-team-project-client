import {
  submitAdminOopSection,
  type AdminOopSectionInput,
  type AdminOopSectionPersistResponse,
} from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminOopSectionKeys } from './adminOopSectionKeys';

export function useSubmitAdminOopSectionMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    AdminOopSectionPersistResponse,
    unknown,
    AdminOopSectionInput
  >({
    mutationFn: submitAdminOopSection,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminOopSectionKeys.all }),
  });
}
