import { submitSectionAnnouncement } from '@aics/api-client';
import type { CreateSectionAnnouncementInput } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '~/features/auth/authStore';
import { studentNoticeKeys } from '~/features/student-notices/queries/studentNoticeKeys';

import { canPublishNotice, noticeSection } from '../noticeScope';
import { adminNoticeKeys } from './adminNoticeKeys';

type SubmitSectionAnnouncementsInput = CreateSectionAnnouncementInput & {
  sectionIds: number[];
};

export type SubmitSectionAnnouncementsResult = {
  failedSectionIds: number[];
  succeededSectionIds: number[];
};

export function useSubmitSectionAnnouncementsMutation() {
  const user = useAuthStore(state => state.currentUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sectionIds,
      ...input
    }: SubmitSectionAnnouncementsInput): Promise<SubmitSectionAnnouncementsResult> => {
      if (sectionIds.length === 0)
        throw new Error('공지사항을 게시할 분반을 하나 이상 선택해 주세요.');

      const unauthorizedSectionId = sectionIds.find(
        sectionId => !canPublishNotice(user, noticeSection(user, sectionId)),
      );
      if (unauthorizedSectionId !== undefined)
        throw new Error('공지사항을 게시할 담당 분반이 필요합니다.');

      const results = await Promise.allSettled(
        sectionIds.map(sectionId =>
          submitSectionAnnouncement(sectionId, input),
        ),
      );

      return results.reduce<SubmitSectionAnnouncementsResult>(
        (result, submission, index) => {
          const sectionId = sectionIds[index];
          if (sectionId === undefined) return result;
          if (submission.status === 'fulfilled') {
            result.succeededSectionIds.push(sectionId);
          } else {
            result.failedSectionIds.push(sectionId);
          }
          return result;
        },
        { failedSectionIds: [], succeededSectionIds: [] },
      );
    },
    onSuccess: async result => {
      await Promise.all(
        result.succeededSectionIds.flatMap(sectionId => [
          queryClient.invalidateQueries({
            queryKey: adminNoticeKeys.list(user?.id, sectionId),
          }),
          queryClient.invalidateQueries({
            queryKey: studentNoticeKeys.sectionAnnouncements(sectionId),
          }),
        ]),
      );
    },
    retry: false,
  });
}
