import { updateMyPassword, type UpdateMyPasswordInput } from '@aics/api-client';
import { useMutation } from '@tanstack/react-query';

export function useUpdateMyPasswordMutation() {
  return useMutation<void, unknown, UpdateMyPasswordInput>({
    mutationFn: updateMyPassword,
  });
}
