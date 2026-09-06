import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

import type { AdminMilestoneWeekNumbersUpdateInput } from './types';

export async function updateAdminSectionMilestoneWeekNumbers(
  sectionId: string,
  input: AdminMilestoneWeekNumbersUpdateInput,
): Promise<void> {
  await apiClient.put(
    ENDPOINTS.ADMIN.SECTION_MILESTONE_WEEK_NUMBERS(sectionId),
    input,
  );
}
