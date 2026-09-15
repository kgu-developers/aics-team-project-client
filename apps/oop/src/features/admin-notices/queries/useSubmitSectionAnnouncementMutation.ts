import { submitSectionAnnouncement } from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminNoticeKeys } from './adminNoticeKeys';

export function useSubmitSectionAnnouncementMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sectionId,
      ...input
    }: Parameters<typeof submitSectionAnnouncement>[1] & {
      sectionId: string;
    }) => submitSectionAnnouncement(sectionId, input),
    onSuccess: (_, variables) =>
      queryClient.invalidateQueries({
        queryKey: adminNoticeKeys.list(variables.sectionId),
      }),
  });
}
