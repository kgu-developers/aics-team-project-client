import { updateAdminMessageRead } from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminMessageKeys } from './adminMessageKeys';

export function useUpdateAdminMessageReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: number) => updateAdminMessageRead(messageId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminMessageKeys.all }),
  });
}
