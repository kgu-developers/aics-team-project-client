import { removeAdminOopSection } from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminOopSectionKeys } from './adminOopSectionKeys';

export function useRemoveAdminOopSectionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeAdminOopSection,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminOopSectionKeys.all }),
  });
}
