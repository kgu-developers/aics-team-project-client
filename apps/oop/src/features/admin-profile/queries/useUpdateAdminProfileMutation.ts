import {
  updateMyProfile,
  type MyProfileResponse,
  type UpdateMyProfileInput,
} from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminProfileKeys } from './adminProfileKeys';

export function useUpdateAdminProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation<MyProfileResponse, unknown, UpdateMyProfileInput>({
    mutationFn: updateMyProfile,
    onSuccess: profile => {
      queryClient.setQueryData(adminProfileKeys.mine(), profile);
      void queryClient.invalidateQueries({
        queryKey: adminProfileKeys.mine(),
      });
    },
  });
}
