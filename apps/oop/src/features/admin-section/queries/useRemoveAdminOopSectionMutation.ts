import {
  removeAdminOopSection,
  type AdminOopSectionsResponse,
} from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminOopSectionKeys } from './adminOopSectionKeys';

export function useRemoveAdminOopSectionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeAdminOopSection,
    onSuccess: (_, sectionId) => {
      queryClient.setQueriesData<AdminOopSectionsResponse>(
        { queryKey: adminOopSectionKeys.all },
        current =>
          current
            ? {
                ...current,
                contents: current.contents.filter(
                  section => section.id !== sectionId,
                ),
              }
            : current,
      );
    },
  });
}
