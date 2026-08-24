import { removeAdminNoticeAttachment } from '@aics/api-client';
import { useMutation } from '@tanstack/react-query';

export function useRemoveAdminNoticeAttachmentMutation() {
  return useMutation({
    mutationFn: removeAdminNoticeAttachment,
  });
}
