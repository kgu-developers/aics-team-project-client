import { fetchAdminMessages } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { adminMessageKeys } from './adminMessageKeys';

export function useAdminMessagesQuery(sectionId?: string, page = 0) {
  return useQuery({
    queryKey: adminMessageKeys.list(sectionId, page),
    queryFn: () => fetchAdminMessages({ sectionId, page, size: 100 }),
  });
}
