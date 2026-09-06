import { apiClient } from '../client';
import type { AdminMilestoneWeekNumbersUpdateInput } from './types';
import { ENDPOINTS } from '../constants/endpoints';


export async function updateAdminSectionMilestoneWeekNumbers(
  sectionId: string,
  input: AdminMilestoneWeekNumbersUpdateInput,
): Promise<void> {
  await apiClient.put(
    ENDPOINTS.ADMIN.SECTION_MILESTONE_WEEK_NUMBERS(sectionId),
    input,
  );
}
