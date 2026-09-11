import type { MilestonePresentation } from '@aics/core';

import { apiClient } from '../client';
import { validateStudentSubmissionId } from './studentSubmissionContract';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchMilestonePresentations(
  milestoneId: string,
): Promise<MilestonePresentation[]> {
  validateStudentSubmissionId(milestoneId);
  const { data } = await apiClient.get<{ contents: MilestonePresentation[] }>(
    ENDPOINTS.SUBMISSION.MILESTONE_PRESENTATIONS(milestoneId),
  );
  if (
    !Array.isArray(data?.contents) ||
    data.contents.some(
      presentation =>
        !presentation ||
        !Number.isSafeInteger(presentation.teamId) ||
        presentation.teamId <= 0 ||
        !Number.isSafeInteger(presentation.submissionId) ||
        presentation.submissionId <= 0 ||
        !Array.isArray(presentation.artifacts) ||
        (presentation.presentationOrder != null &&
          (!Number.isSafeInteger(presentation.presentationOrder) ||
            presentation.presentationOrder < 1)) ||
        (presentation.project &&
          presentation.project.teamId !== presentation.teamId),
    )
  )
    throw new Error('발표 팀 목록 응답을 확인할 수 없어요.');
  return data.contents;
}
