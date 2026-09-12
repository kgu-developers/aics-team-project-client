import {
  type AdminOopSectionContactVisibilityInput,
  updateAdminOopSectionContactVisibility,
} from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminOopSectionKeys } from './adminOopSectionKeys';

export function useUpdateAdminOopSectionContactVisibilityMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    unknown,
    { input: AdminOopSectionContactVisibilityInput; sectionId: number }
  >({
    mutationFn: updateAdminOopSectionContactVisibility,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminOopSectionKeys.all }),
  });
}
