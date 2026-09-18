import {
  type AdminOopSectionDto,
  type AdminOopSectionUpdateInput,
  updateAdminOopSection,
} from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '~/features/auth/authStore';
import { authKeys } from '~/features/auth/queries';

import { adminOopSectionKeys } from './adminOopSectionKeys';

export function useUpdateAdminOopSectionMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    AdminOopSectionDto,
    unknown,
    { input: AdminOopSectionUpdateInput; sectionId: number }
  >({
    mutationFn: updateAdminOopSection,
    onSuccess: section => {
      const session = useAuthStore.getState();
      const currentUser = session.currentUser;

      if (currentUser) {
        const nextUser = {
          ...currentUser,
          sections: currentUser.sections.map(currentSection =>
            currentSection.id === String(section.id)
              ? {
                  ...currentSection,
                  code: section.code,
                  name: section.name,
                }
              : currentSection,
          ),
        };
        session.setCurrentUser(nextUser);
        queryClient.setQueryData(authKeys.currentUser(), nextUser);
      }

      return queryClient.invalidateQueries({
        queryKey: adminOopSectionKeys.all,
      });
    },
  });
}
