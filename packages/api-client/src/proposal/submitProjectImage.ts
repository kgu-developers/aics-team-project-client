import type { ProjectImageUploadResponse } from '@aics/core';

import { apiClient } from '../client';
import {
  assertProposalId,
  parseProjectImageUpload,
} from './projectProposalContract';
import { ENDPOINTS } from '../constants/endpoints';
export async function submitProjectImage(
  teamId: string,
  file: File,
): Promise<ProjectImageUploadResponse> {
  assertProposalId(teamId);
  const body = new FormData();
  body.append('file', file);
  const response = await apiClient.post<unknown>(
    ENDPOINTS.PROJECT_PROPOSAL.IMAGE_UPLOAD(teamId),
    body,
    // The shared client defaults to JSON; multipart needs the browser boundary.
    { headers: { 'Content-Type': undefined } },
  );
  return parseProjectImageUpload(response.data);
}
