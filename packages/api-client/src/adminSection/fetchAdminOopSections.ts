import type { AdminOopSectionsFilter, AdminOopSectionsResponse } from './types';
import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type { AdminOopSectionsFilter, AdminOopSectionsResponse } from './types';

export async function fetchAdminOopSections(
  filter: AdminOopSectionsFilter,
): Promise<AdminOopSectionsResponse> {
  const response = await apiClient.get<AdminOopSectionsResponse>(
    ENDPOINTS.ADMIN.OOP_SECTIONS,
    { params: filter },
  );

  return response.data;
}
