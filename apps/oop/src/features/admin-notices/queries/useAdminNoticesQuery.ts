import { fetchAdminNotices } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { adminNoticeKeys } from './adminNoticeKeys';

export function useAdminNoticesQuery() {
  return useQuery({
    queryFn: fetchAdminNotices,
    queryKey: adminNoticeKeys.list(),
  });
}
