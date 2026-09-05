import {
  fetchAdminOopSections,
  type AdminOopSectionsFilter,
} from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { adminOopSectionKeys } from './adminOopSectionKeys';

type AdminOopSectionsQueryInput =
  | (Partial<AdminOopSectionsFilter> & {
      courseId?: number;
      professorId?: string;
    })
  | undefined;

function hasRequiredFilter(
  input: AdminOopSectionsQueryInput,
): input is AdminOopSectionsFilter {
  return input?.courseId !== undefined && Boolean(input.professorId);
}

export function useAdminOopSectionsQuery(input: AdminOopSectionsQueryInput) {
  const isEnabled = hasRequiredFilter(input);
  const filter = isEnabled ? input : undefined;

  return useQuery({
    enabled: isEnabled,
    queryKey: filter
      ? adminOopSectionKeys.list(filter)
      : ([...adminOopSectionKeys.all, 'disabled'] as const),
    queryFn: () => {
      if (!filter) {
        throw new Error('과목과 담당 교수 정보가 필요합니다.');
      }

      return fetchAdminOopSections(filter);
    },
  });
}
