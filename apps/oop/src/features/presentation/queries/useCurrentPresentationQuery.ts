import { fetchCurrentPresentation } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { presentationKeys } from './presentationKeys';

export function useCurrentPresentationQuery(enabled: boolean) {
  return useQuery({
    enabled,
    queryKey: presentationKeys.current(),
    queryFn: fetchCurrentPresentation,
  });
}
