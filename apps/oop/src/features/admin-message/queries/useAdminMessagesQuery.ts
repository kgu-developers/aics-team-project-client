import { fetchAdminMessages } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { adminMessageKeys } from './adminMessageKeys';

export function useAdminMessagesQuery(sectionId?: string) {
  return useQuery({
    queryKey: adminMessageKeys.list(sectionId),
    queryFn: () => fetchAdminMessages({ sectionId, page: 0, size: 100 }),
  });
}
