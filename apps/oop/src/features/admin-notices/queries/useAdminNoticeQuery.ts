import { fetchAdminNotice } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { adminNoticeKeys } from './adminNoticeKeys';

export function useAdminNoticeQuery(noticeId: string) {
  return useQuery({
    enabled: Boolean(noticeId),
    queryFn: () => fetchAdminNotice(noticeId),
    queryKey: adminNoticeKeys.detail(noticeId),
  });
}
