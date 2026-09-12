import type { StudentSubmissionVersionInput } from '@aics/core';
export type { StudentSubmissionVersionInput } from '@aics/core';

import { apiClient } from '../client';
import {
  validateStudentSubmission,
  validateStudentSubmissionId,
} from './studentSubmissionContract';
import { ENDPOINTS } from '../constants/endpoints';

/** Files and fileArtifactIds have the same order; non-FILE artifacts are a JSON part. */
export async function submitStudentSubmissionVersion(
  submissionId: string,
  input: StudentSubmissionVersionInput,
) {
  validateStudentSubmissionId(submissionId);
  if (!input.description.trim()) throw new Error('제출 설명을 입력해 주세요.');
  const ids = [...input.files, ...input.artifacts].map(
    item => item.requiredArtifactId,
  );
  if (
    ids.some(id => !Number.isSafeInteger(id) || id <= 0) ||
    new Set(ids).size !== ids.length
  )
    throw new Error('제출 산출물의 식별자를 확인해 주세요.');
  const params = new URLSearchParams({ description: input.description });
  if (input.changeNote) params.set('changeNote', input.changeNote);
  const body = new FormData();
  for (const { requiredArtifactId, file } of input.files) {
    if (file.size === 0) throw new Error('빈 파일은 제출할 수 없어요.');
    params.append('fileArtifactIds', String(requiredArtifactId));
    body.append('files', file);
  }
  if (input.artifacts.length) {
    for (const artifact of input.artifacts) {
      if (
        !['LINK', 'TEXT', 'CHEERPJ_RUN'].includes(artifact.type) ||
        !(artifact.type === 'TEXT' ? artifact.content : artifact.url)?.trim()
      )
        throw new Error('제출 산출물 내용을 확인해 주세요.');
    }
    body.append(
      'artifacts',
      new Blob([JSON.stringify(input.artifacts)], { type: 'application/json' }),
    );
  }
  const response = await apiClient.post<unknown>(
    ENDPOINTS.SUBMISSION.VERSIONS(submissionId),
    body,
    {
      params,
      // Remove the client's JSON default; the browser adds the multipart boundary.
      headers: { 'Content-Type': undefined },
    },
  );
  validateStudentSubmission(response.data);
  if (String(response.data.id) !== submissionId)
    throw new Error('제출 결과의 식별자를 확인할 수 없습니다.');
  return response.data;
}
