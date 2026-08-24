import { fetchCurrentMidReport } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { midReportKeys } from './midReportKeys';

export function useCurrentMidReportQuery(enabled: boolean) {
  return useQuery({
    enabled,
    queryKey: midReportKeys.current(),
    queryFn: fetchCurrentMidReport,
  });
}
