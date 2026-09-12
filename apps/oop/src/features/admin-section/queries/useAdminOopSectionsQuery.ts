import {
  fetchAdminOopSections,
  type AdminOopSectionsFilter,
} from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { adminOopSectionKeys } from './adminOopSectionKeys';

type AdminOopSectionsQueryInput = AdminOopSectionsFilter | undefined;

export function useAdminOopSectionsQuery(input: AdminOopSectionsQueryInput) {
  const filter = input;

  return useQuery({
    enabled: filter !== undefined,
    queryKey: filter
      ? adminOopSectionKeys.list(filter)
      : ([...adminOopSectionKeys.all, 'disabled'] as const),
    queryFn: () => {
      if (!filter) {
        throw new Error('강좌 또는 담당 교수 정보가 필요합니다.');
      }

      return fetchAdminOopSections(filter);
    },
  });
}
