import { submitSectionAnnouncement } from '@aics/api-client';
import type { CreateSectionAnnouncementInput } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '~/features/auth/authStore';
import { studentNoticeKeys } from '~/features/student-notices/queries/studentNoticeKeys';

import { canPublishNotice, noticeId, noticeSection } from '../noticeScope';
import { adminNoticeKeys } from './adminNoticeKeys';

export function useSubmitSectionAnnouncementMutation() {
  const user = useAuthStore(state => state.currentUser);
  const queryClient = useQueryClient();
  return useMutation({
    retry: false,
    onMutate: () => ({ actorId: user?.id }),
    mutationFn: ({
      sectionId: value,
      ...input
    }: CreateSectionAnnouncementInput & { sectionId: string | number }) => {
      const sectionId = noticeId(value);
      if (
        sectionId === undefined ||
        !canPublishNotice(user, noticeSection(user, sectionId))
      )
        throw new Error('공지사항을 게시할 담당 분반이 필요합니다.');
      return submitSectionAnnouncement(sectionId, input);
    },
    onSuccess: async (_, variables, context) => {
      const actorId = context?.actorId;
      const sectionId = noticeId(variables.sectionId);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: adminNoticeKeys.list(actorId, sectionId),
        }),
        queryClient.invalidateQueries({
          queryKey: studentNoticeKeys.sectionAnnouncements(sectionId),
        }),
      ]);
    },
  });
}
