import { updateSectionAnnouncement } from '@aics/api-client';
import type {
  SectionAnnouncement,
  UpdateSectionAnnouncementInput,
} from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '~/features/auth/authStore';
import { studentNoticeKeys } from '~/features/student-notices/queries/studentNoticeKeys';

import { canPublishNotice, noticeId, noticeSection } from '../noticeScope';
import { adminNoticeKeys } from './adminNoticeKeys';

export function useUpdateSectionAnnouncementMutation() {
  const user = useAuthStore(state => state.currentUser);
  const queryClient = useQueryClient();
  return useMutation({
    retry: false,
    onMutate: () => ({ actorId: user?.id }),
    mutationFn: ({
      announcementId,
      sectionId: value,
      ...input
    }: UpdateSectionAnnouncementInput & {
      announcementId: string | number;
      sectionId: string | number;
    }) => {
      const sectionId = noticeId(value);
      const id = noticeId(announcementId);
      if (
        id === undefined ||
        sectionId === undefined ||
        !canPublishNotice(user, noticeSection(user, sectionId))
      )
        throw new Error('공지사항을 수정할 담당 분반이 필요합니다.');
      return updateSectionAnnouncement(id, input);
    },
    onSuccess: async (announcement, variables, context) => {
      const actorId = context?.actorId;
      const sectionId = noticeId(variables.sectionId);
      // Never seed another section's detail from a mismatched response.
      if (
        announcement.sectionId === sectionId &&
        announcement.id === noticeId(variables.announcementId)
      ) {
        queryClient.setQueryData(
          adminNoticeKeys.detail(actorId, sectionId, announcement.id),
          announcement,
        );
        queryClient.setQueryData<SectionAnnouncement[]>(
          adminNoticeKeys.list(actorId, sectionId),
          previous =>
            previous?.map(item =>
              item.id === announcement.id ? { ...item, ...announcement } : item,
            ),
        );
      }
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: adminNoticeKeys.list(actorId, sectionId),
        }),
        queryClient.invalidateQueries({
          queryKey: adminNoticeKeys.detail(
            actorId,
            sectionId,
            noticeId(variables.announcementId),
          ),
        }),
        queryClient.invalidateQueries({
          queryKey: studentNoticeKeys.sectionAnnouncements(sectionId),
        }),
      ]);
    },
  });
}
