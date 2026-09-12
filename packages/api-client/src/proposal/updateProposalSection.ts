import {
  PROPOSAL_SECTIONS,
  type ProposalSectionType,
  type UpdateProposalSectionInput,
} from '@aics/core';

import { apiClient } from '../client';
import {
  assertProposalId,
  parseProposalSection,
} from './projectProposalContract';
import { ENDPOINTS } from '../constants/endpoints';
export async function updateProposalSection(
  projectId: number,
  section: ProposalSectionType,
  input: UpdateProposalSectionInput,
) {
  assertProposalId(projectId);
  if (!PROPOSAL_SECTIONS.includes(section))
    throw new Error('유효한 제안서 영역이 필요합니다.');
  if (input.assigneeUserId && input.assigneeUserId.length > 20)
    throw new Error('담당자 학번은 20자 이내여야 합니다.');
  // The documented request keeps assigneeUserId optional rather than nullable.
  const body = {
    completed: input.completed,
    ...(input.assigneeUserId ? { assigneeUserId: input.assigneeUserId } : {}),
  };
  const response = await apiClient.put<unknown>(
    ENDPOINTS.PROJECT_PROPOSAL.SECTION(projectId, section),
    body,
  );
  const result = parseProposalSection(response.data);
  if (result.section !== section)
    throw new Error('제안서 영역이 일치하지 않습니다.');
  return result;
}
