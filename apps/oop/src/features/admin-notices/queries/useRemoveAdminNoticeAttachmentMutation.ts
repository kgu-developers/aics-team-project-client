import { removeAdminNoticeAttachment } from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminNoticeKeys } from './adminNoticeKeys';

export function useRemoveAdminNoticeAttachmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeAdminNoticeAttachment,
    onSuccess: async (_data, noticeId) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: adminNoticeKeys.detail(noticeId),
        }),
        queryClient.invalidateQueries({ queryKey: adminNoticeKeys.list() }),
      ]);
    },
  });
}
