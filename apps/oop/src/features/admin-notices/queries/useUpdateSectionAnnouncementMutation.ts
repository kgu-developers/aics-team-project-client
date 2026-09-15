import { updateSectionAnnouncement } from '@aics/api-client';
import type { SectionAnnouncement } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminNoticeKeys } from './adminNoticeKeys';

export function useUpdateSectionAnnouncementMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      announcementId,
      ...input
    }: Parameters<typeof updateSectionAnnouncement>[1] & {
      announcementId: string | number;
    }) => updateSectionAnnouncement(announcementId, input),
    onSuccess: announcement => {
      const sectionId = String(announcement.sectionId);

      queryClient.setQueryData(
        adminNoticeKeys.detail(sectionId, String(announcement.id)),
        announcement,
      );
      queryClient.setQueryData<SectionAnnouncement[]>(
        adminNoticeKeys.list(sectionId),
        previous =>
          previous?.map(item =>
            item.id === announcement.id ? announcement : item,
          ),
      );
      void queryClient.invalidateQueries({
        queryKey: adminNoticeKeys.list(String(announcement.sectionId)),
      });
    },
  });
}
