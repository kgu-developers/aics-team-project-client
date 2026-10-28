import { submitSectionTeamMessage } from '@aics/api-client';
import type { SubmitSectionTeamMessageInput } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminMessageKeys } from '~/features/admin-message/queries/adminMessageKeys';

import { teamMessageKeys } from './teamMessageKeys';

function isValidPositiveSectionId(sectionId?: string): sectionId is string {
  return (
    sectionId != null &&
    /^\d+$/.test(sectionId) &&
    Number.isSafeInteger(Number(sectionId)) &&
    Number(sectionId) > 0
  );
}

export function useSubmitSectionTeamMessageMutation(sectionId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitSectionTeamMessageInput) => {
      if (!isValidPositiveSectionId(sectionId)) {
        throw new Error('분반 정보를 확인한 뒤 다시 시도해 주세요.');
      }
      if (!input.message.trim()) {
        throw new Error('메시지 내용을 입력해 주세요.');
      }
      return submitSectionTeamMessage(sectionId, input);
    },
    onMutate: () => ({ sectionId }),
    onSuccess: async () => {
      // The server creates one message per recipient team. Refresh both the
      // team threads and the administrator inbox/dashboard summaries.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: teamMessageKeys.all }),
        queryClient.invalidateQueries({ queryKey: adminMessageKeys.all }),
      ]);
    },
    retry: false,
  });
}
