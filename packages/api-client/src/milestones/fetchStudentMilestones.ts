import type { StudentMilestoneListResponse } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchStudentMilestones(sectionId: string) {
  const { data } = await apiClient.get<StudentMilestoneListResponse>(
    ENDPOINTS.STUDENT_MILESTONE.LIST(sectionId),
  );
  if (
    !Array.isArray(data.contents) ||
    data.contents.some(
      item =>
        !Number.isSafeInteger(item.id) ||
        item.id <= 0 ||
        item.sectionId !== Number(sectionId),
    )
  ) {
    throw new Error('마일스톤의 분반 정보를 확인할 수 없습니다.');
  }
  return data.contents;
}
