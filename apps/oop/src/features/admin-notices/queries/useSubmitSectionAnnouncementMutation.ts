import { submitSectionAnnouncement } from '@aics/api-client';
import type { SectionAnnouncementCreateRequest } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '~/features/auth/authStore';
import { studentNoticeKeys } from '~/features/student-notices/queries/studentNoticeKeys';

import { canPublishNotice, noticeSection } from '../noticeScope';
import { adminNoticeKeys } from './adminNoticeKeys';

export function useSubmitSectionAnnouncementMutation(
  sectionId: number | undefined,
) {
  const user = useAuthStore(state => state.currentUser);
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: (
      input: Pick<SectionAnnouncementCreateRequest, 'title' | 'content'>,
    ) => {
      if (
        sectionId === undefined ||
        !canPublishNotice(user, noticeSection(user, sectionId))
      )
        throw new Error('공지사항을 게시할 담당 분반이 필요합니다.');
      return submitSectionAnnouncement(sectionId, input);
    },
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({
          queryKey: adminNoticeKeys.list(user?.id, sectionId),
        }),
        client.invalidateQueries({
          queryKey: studentNoticeKeys.sectionAnnouncements(sectionId),
        }),
      ]);
    },
  });
}
