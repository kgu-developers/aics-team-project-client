import {
  submitAdminSectionMilestone,
  updateAdminSectionMilestoneStatus,
  type AdminMilestoneCreateInput,
} from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { adminSectionMilestoneKeys } from './adminSectionMilestoneKeys';

export type SubmitAdminSectionMilestonesInput = {
  sections: readonly {
    input: AdminMilestoneCreateInput;
    publish: boolean;
    sectionId: string;
  }[];
};

export type SubmitAdminSectionMilestonesResult = {
  failureMessage?: string;
  milestoneId?: number;
  sectionId: string;
  status: 'created' | 'create-failed' | 'publish-failed' | 'published';
};

function getCreationFailureMessage(error: unknown) {
  if (isAxiosError(error)) {
    if (error.response?.status === 409)
      return '같은 분반에 해당 주차의 마일스톤이 이미 있습니다.';
    if (error.response?.status === 400)
      return '입력한 제목, 주차, 일정을 확인해주세요.';
    if (error.response?.status === 401 || error.response?.status === 403)
      return '이 분반의 마일스톤을 생성할 권한이 없습니다.';
  }

  return '생성에 실패했습니다. 잠시 후 다시 시도해주세요.';
}

export function useSubmitAdminSectionMilestonesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sections }: SubmitAdminSectionMilestonesInput) =>
      Promise.all(
        sections.map(async ({ input, publish, sectionId }) => {
          try {
            const { id } = await submitAdminSectionMilestone(sectionId, input);
            if (!publish) {
              return { milestoneId: id, sectionId, status: 'created' } as const;
            }

            try {
              await updateAdminSectionMilestoneStatus(
                sectionId,
                String(id),
                'PUBLISHED',
              );
              return {
                milestoneId: id,
                sectionId,
                status: 'published',
              } as const;
            } catch {
              return {
                milestoneId: id,
                sectionId,
                status: 'publish-failed',
              } as const;
            }
          } catch (error) {
            return {
              failureMessage: getCreationFailureMessage(error),
              sectionId,
              status: 'create-failed',
            } as const;
          }
        }),
      ),
    onSuccess: async results => {
      await Promise.all(
        results
          .filter(result => result.status !== 'create-failed')
          .map(result =>
            queryClient.invalidateQueries({
              queryKey: adminSectionMilestoneKeys.list(result.sectionId),
            }),
          ),
      );
    },
  });
}
