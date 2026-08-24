import {
  updateMyProfile,
  type MyProfileResponse,
  type UpdateMyProfileInput,
} from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '~/features/auth/authStore';

import { adminProfileKeys } from './adminProfileKeys';

export function useUpdateAdminProfileMutation() {
  const queryClient = useQueryClient();
  const accountId = useAuthStore(state => state.currentUser?.studentNumber);
  const profileKey = adminProfileKeys.mine(accountId ?? 'anonymous');

  return useMutation<MyProfileResponse, unknown, UpdateMyProfileInput>({
    mutationFn: updateMyProfile,
    onSuccess: profile => {
      queryClient.setQueryData(profileKey, profile);
      void queryClient.invalidateQueries({ queryKey: profileKey });
    },
  });
}
