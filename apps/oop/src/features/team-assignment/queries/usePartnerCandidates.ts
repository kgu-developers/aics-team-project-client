import { searchPartnerCandidates } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

export function usePartnerCandidates(sectionId: string, query: string) {
  const normalizedQuery = query.trim();

  return useQuery({
    enabled: Boolean(sectionId) && normalizedQuery.length > 0,
    queryKey: [
      'team-assignment',
      sectionId,
      'partner-candidates',
      normalizedQuery,
    ] as const,
    queryFn: () => searchPartnerCandidates(sectionId, normalizedQuery),
    retry: false,
  });
}
