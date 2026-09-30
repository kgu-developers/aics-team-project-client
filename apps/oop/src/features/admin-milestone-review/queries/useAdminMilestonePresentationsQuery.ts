import { fetchMilestonePresentations } from '@aics/api-client';
import { skipToken, useQuery } from '@tanstack/react-query';

import { adminPresentationProgressKeys } from './adminPresentationProgressKeys';

const presignedUrlRefreshInterval = 10 * 60 * 1000;

/** 담당 교수의 발표 진행 화면에서 최신 발표 자료와 임시 다운로드 URL을 조회한다. */
export function useAdminMilestonePresentationsQuery(
  milestoneId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: adminPresentationProgressKeys.roster(milestoneId ?? ''),
    queryFn:
      milestoneId && enabled
        ? () => fetchMilestonePresentations(milestoneId)
        : skipToken,
    refetchInterval: presignedUrlRefreshInterval,
    refetchOnWindowFocus: true,
    staleTime: presignedUrlRefreshInterval,
  });
}
