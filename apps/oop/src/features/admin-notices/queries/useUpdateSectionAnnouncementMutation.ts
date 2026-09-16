import { updateSectionAnnouncement } from '@aics/api-client';
import type {
  SectionAnnouncementResponse,
  SectionAnnouncementUpdateRequest,
} from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '~/features/auth/authStore';
import { studentNoticeKeys } from '~/features/student-notices/queries/studentNoticeKeys';

import { canPublishNotice, noticeSection } from '../noticeScope';
import { adminNoticeKeys } from './adminNoticeKeys';

export function useUpdateSectionAnnouncementMutation(
  notice: SectionAnnouncementResponse,
) {
  const user = useAuthStore(state => state.currentUser);
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: (
      input: Pick<SectionAnnouncementUpdateRequest, 'title' | 'content'>,
    ) => {
      if (!canPublishNotice(user, noticeSection(user, notice.sectionId)))
        throw new Error('공지사항을 수정할 담당 분반이 필요합니다.');
      return updateSectionAnnouncement(notice.id, input);
    },
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({
          queryKey: adminNoticeKeys.list(user?.id, notice.sectionId),
        }),
        client.invalidateQueries({
          queryKey: studentNoticeKeys.sectionAnnouncements(notice.sectionId),
        }),
      ]);
    },
  });
}
