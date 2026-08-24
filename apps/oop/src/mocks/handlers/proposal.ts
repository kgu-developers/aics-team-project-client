import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import type {
  CompleteProposalBlockInput,
  ProposalBlockKey,
  SubmitProposalInput,
  UpdateProposalBlockInput,
} from '@aics/core';
import { http, HttpResponse } from 'msw';

import {
  findDocumentEditLockHeldByOther,
  isEditLockHeldByOther,
  withDocumentEditLocks,
} from './editLock';
import { requireStudent } from './studentGuard';
import {
  canCompleteProposalBlock,
  completeProposalBlock,
  getCurrentProposal,
  saveProposalBlock,
  submitCurrentProposal,
} from '../data/proposal';

function error(code: string, message: string, status: number) {
  return HttpResponse.json({ code, message }, { status });
}

function validateProposalId(
  proposalId: string | readonly string[] | undefined,
) {
  if (proposalId !== getCurrentProposal().id)
    return error('PROPOSAL_NOT_FOUND', '제안서를 찾을 수 없어요.', 404);
  return null;
}

export const proposalHandlers = [
  http.get(`${API_BASE_URL}${ENDPOINTS.PROPOSAL.CURRENT}`, ({ request }) => {
    const student = requireStudent(request, '제안서');
    if ('response' in student) return student.response;
    return HttpResponse.json(
      withDocumentEditLocks(
        getCurrentProposal(),
        'PROJECT_BLOCK',
        student.name,
      ),
    );
  }),
  http.patch(
    `${API_BASE_URL}${ENDPOINTS.PROPOSAL.BLOCK(':proposalId', ':blockKey')}`,
    async ({ params, request }) => {
      const student = requireStudent(request, '제안서');
      if ('response' in student) return student.response;
      const idError = validateProposalId(params.proposalId);
      if (idError) return idError;
      const proposal = getCurrentProposal();
      const block = proposal.blocks.find(item => item.key === params.blockKey);
      if (!block)
        return error(
          'PROPOSAL_BLOCK_NOT_FOUND',
          '작성 영역을 찾을 수 없어요.',
          404,
        );
      let input: UpdateProposalBlockInput;
      try {
        input = (await request.json()) as UpdateProposalBlockInput;
      } catch {
        return error(
          'INVALID_REQUEST',
          '저장 요청 형식이 올바르지 않아요.',
          400,
        );
      }
      if (
        !input ||
        !Array.isArray(input.fields) ||
        typeof input.version !== 'number'
      )
        return error('INVALID_REQUEST', '저장할 내용이 올바르지 않아요.', 400);
      const currentProposal = getCurrentProposal();
      if (currentProposal.version !== input.version)
        return error(
          'VERSION_CONFLICT',
          '최신 문서를 다시 불러와야 해요.',
          409,
        );
      if (currentProposal.status === 'SUBMITTED')
        return error(
          'PROPOSAL_SUBMITTED',
          '제출한 제안서는 수정할 수 없어요.',
          409,
        );
      const lock = isEditLockHeldByOther(
        {
          targetType: 'PROJECT_BLOCK',
          targetId: `${currentProposal.id}:${params.blockKey}`,
        },
        student.name,
      );
      if (lock)
        return error(
          'BLOCK_LOCKED',
          `${lock.lockedBy}님이 이 영역을 편집 중이에요.`,
          409,
        );
      const saved = saveProposalBlock(
        params.blockKey as ProposalBlockKey,
        input.version,
        input.fields,
        student.name,
      );
      if (!saved)
        return error(
          'VERSION_CONFLICT',
          '최신 문서를 다시 불러와야 해요.',
          409,
        );
      return HttpResponse.json(
        withDocumentEditLocks(saved, 'PROJECT_BLOCK', student.name),
      );
    },
  ),
  http.post(
    `${API_BASE_URL}${ENDPOINTS.PROPOSAL.BLOCK_COMPLETION(':proposalId', ':blockKey')}`,
    async ({ params, request }) => {
      const student = requireStudent(request, '제안서');
      if ('response' in student) return student.response;
      const idError = validateProposalId(params.proposalId);
      if (idError) return idError;
      const proposal = getCurrentProposal();
      const block = proposal.blocks.find(item => item.key === params.blockKey);
      if (!block)
        return error(
          'PROPOSAL_BLOCK_NOT_FOUND',
          '작성 영역을 찾을 수 없어요.',
          404,
        );
      let input: CompleteProposalBlockInput;
      try {
        input = (await request.json()) as CompleteProposalBlockInput;
      } catch {
        return error(
          'INVALID_REQUEST',
          '완료 처리 요청 형식이 올바르지 않아요.',
          400,
        );
      }
      if (typeof input?.version !== 'number')
        return error('INVALID_REQUEST', '버전 정보가 필요해요.', 400);
      const currentProposal = getCurrentProposal();
      if (currentProposal.version !== input.version)
        return error(
          'VERSION_CONFLICT',
          '최신 문서를 다시 불러와야 해요.',
          409,
        );
      if (currentProposal.status === 'SUBMITTED')
        return error(
          'PROPOSAL_SUBMITTED',
          '제출한 제안서는 완료 처리할 수 없어요.',
          409,
        );
      const currentBlock = currentProposal.blocks.find(
        item => item.key === params.blockKey,
      )!;
      const lock = isEditLockHeldByOther(
        {
          targetType: 'PROJECT_BLOCK',
          targetId: `${currentProposal.id}:${params.blockKey}`,
        },
        student.name,
      );
      if (lock)
        return error(
          'BLOCK_LOCKED',
          `${lock.lockedBy}님이 이 영역을 편집 중이에요.`,
          409,
        );
      if (!canCompleteProposalBlock(currentBlock))
        return error(
          'BLOCK_INCOMPLETE',
          '모든 항목을 작성한 뒤 완료 처리해 주세요.',
          422,
        );
      const completed = completeProposalBlock(
        params.blockKey as ProposalBlockKey,
        input.version,
        student.name,
      );
      if (!completed)
        return error(
          'VERSION_CONFLICT',
          '최신 문서를 다시 불러와야 해요.',
          409,
        );
      return HttpResponse.json(
        withDocumentEditLocks(completed, 'PROJECT_BLOCK', student.name),
      );
    },
  ),
  http.post(
    `${API_BASE_URL}${ENDPOINTS.PROPOSAL.SUBMIT(':proposalId')}`,
    async ({ params, request }) => {
      const student = requireStudent(request, '제안서');
      if ('response' in student) return student.response;
      const idError = validateProposalId(params.proposalId);
      if (idError) return idError;
      let input: SubmitProposalInput;
      try {
        input = (await request.json()) as SubmitProposalInput;
      } catch {
        return error(
          'INVALID_REQUEST',
          '제출 요청 형식이 올바르지 않아요.',
          400,
        );
      }
      if (typeof input?.version !== 'number')
        return error('INVALID_REQUEST', '버전 정보가 필요해요.', 400);
      const proposal = getCurrentProposal();
      if (proposal.version !== input.version)
        return error(
          'VERSION_CONFLICT',
          '최신 문서를 다시 불러와야 해요.',
          409,
        );
      if (proposal.status === 'SUBMITTED')
        return error('PROPOSAL_SUBMITTED', '이미 제출한 제안서예요.', 409);
      if (proposal.teamLeaderName !== student.name)
        return error('FORBIDDEN', '팀장만 제안서를 제출할 수 있어요.', 403);
      const lock = findDocumentEditLockHeldByOther(
        'PROJECT_BLOCK',
        proposal.id,
        proposal.blocks.map(block => block.key),
        student.name,
      );
      if (lock)
        return error(
          'DOCUMENT_LOCKED',
          `${lock.lockedBy}님이 문서 영역을 편집 중이에요.`,
          409,
        );
      if (proposal.blocks.some(block => block.status !== 'COMPLETED'))
        return error(
          'PROPOSAL_INCOMPLETE',
          '모든 작성 영역을 완료 처리해 주세요.',
          422,
        );
      const submitted = submitCurrentProposal(input.version, student.name);
      if (!submitted)
        return error(
          'VERSION_CONFLICT',
          '최신 문서를 다시 불러와야 해요.',
          409,
        );
      return HttpResponse.json(submitted);
    },
  ),
];
