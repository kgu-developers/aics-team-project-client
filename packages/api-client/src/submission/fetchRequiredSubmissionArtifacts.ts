import type { RequiredSubmissionArtifact } from '@aics/core';

import { apiClient } from '../client';
import { validateStudentSubmissionId } from './studentSubmissionContract';

export async function fetchRequiredSubmissionArtifacts(
  sectionId: string,
  milestoneId: string,
): Promise<RequiredSubmissionArtifact[]> {
  validateStudentSubmissionId(sectionId);
  validateStudentSubmissionId(milestoneId);
  const { data } = await apiClient.get<{
    contents: RequiredSubmissionArtifact[];
  }>(
    `/api/v1/sections/${sectionId}/milestones/${milestoneId}/required-artifacts`,
  );
  if (
    !data ||
    !Array.isArray(data.contents) ||
    data.contents.some(
      item =>
        !item ||
        !Number.isSafeInteger(item.id) ||
        item.id <= 0 ||
        !['FILE', 'LINK', 'TEXT', 'CHEERPJ_RUN'].includes(item.type) ||
        typeof item.label !== 'string' ||
        typeof item.required !== 'boolean' ||
        !Array.isArray(item.allowedExtensions) ||
        !item.allowedExtensions.every(
          extension => typeof extension === 'string',
        ) ||
        (item.maxFileSizeMb != null &&
          (!Number.isSafeInteger(item.maxFileSizeMb) ||
            item.maxFileSizeMb <= 0)),
    ) ||
    new Set(data.contents.map(item => item.id)).size !== data.contents.length
  )
    throw new Error('필수 산출물 규칙을 확인할 수 없습니다.');
  return data.contents;
}
