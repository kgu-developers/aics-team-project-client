import { fetchAdminMessageRecipients } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { adminMessageKeys } from './adminMessageKeys';

export function useAdminMessageRecipientsQuery(messageId?: number) {
  return useQuery({
    enabled: messageId !== undefined,
    queryKey: adminMessageKeys.recipients(messageId ?? 'missing'),
    queryFn: () => {
      if (messageId === undefined) {
        throw new Error(
          '수신 팀 목록을 조회하려면 메시지 식별자가 필요합니다.',
        );
      }
      return fetchAdminMessageRecipients(messageId);
    },
  });
}
