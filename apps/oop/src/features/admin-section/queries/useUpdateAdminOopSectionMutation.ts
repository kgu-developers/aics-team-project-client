import {
  type AdminOopSectionUpdateInput,
  updateAdminOopSection,
} from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminOopSectionKeys } from './adminOopSectionKeys';

export function useUpdateAdminOopSectionMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    unknown,
    { input: AdminOopSectionUpdateInput; sectionId: number }
  >({
    mutationFn: updateAdminOopSection,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminOopSectionKeys.all }),
  });
}
