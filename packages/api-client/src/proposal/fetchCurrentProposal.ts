import type { Proposal } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export class InvalidProposalResponseError extends Error {
  constructor() {
    super('서버 응답이 제안서 편집 문서 형식과 일치하지 않습니다.');
    this.name = 'InvalidProposalResponseError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export async function fetchCurrentProposal(): Promise<Proposal> {
  const response = await apiClient.get<unknown>(ENDPOINTS.PROPOSAL.CURRENT);
  const data = response.data;
  if (
    !isRecord(data) ||
    typeof data.id !== 'string' ||
    (data.status !== 'DRAFT' &&
      data.status !== 'SUBMITTED' &&
      data.status !== 'REVISION_REQUESTED') ||
    !Number.isSafeInteger(data.version) ||
    !Array.isArray(data.blocks) ||
    !data.blocks.every(
      block =>
        isRecord(block) &&
        (block.status === 'IN_PROGRESS' || block.status === 'COMPLETED') &&
        typeof block.key === 'string' &&
        typeof block.title === 'string' &&
        typeof block.description === 'string' &&
        Array.isArray(block.fields) &&
        block.fields.every(
          field =>
            isRecord(field) &&
            typeof field.key === 'string' &&
            typeof field.label === 'string' &&
            typeof field.value === 'string',
        ),
    )
  )
    throw new InvalidProposalResponseError();
  return data as Proposal;
}
