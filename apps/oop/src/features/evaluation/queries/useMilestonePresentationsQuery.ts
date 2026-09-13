import { fetchMilestonePresentations } from '@aics/api-client';
import { skipToken, useQuery } from '@tanstack/react-query';

import { evaluationKeys } from './evaluationKeys';

/** 제출 파일 downloadUrl은 15분짜리 presigned 주소라 만료 전에 다시 받아 둔다. */
const presignedUrlRefreshInterval = 10 * 60 * 1000;

export function useMilestonePresentationsQuery(milestoneId: string) {
  return useQuery({
    queryKey: evaluationKeys.presentationRoster(milestoneId),
    queryFn: milestoneId
      ? () => fetchMilestonePresentations(milestoneId)
      : skipToken,
    refetchInterval: presignedUrlRefreshInterval,
    refetchOnWindowFocus: true,
    staleTime: presignedUrlRefreshInterval,
  });
}
