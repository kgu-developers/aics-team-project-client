import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import type {
  CompleteDocumentBlockInput,
  PresentationBlockKey,
  SubmitDocumentSessionInput,
  UpdatePresentationBlockInput,
} from '@aics/core';
import { http, HttpResponse } from 'msw';

import {
  findDocumentEditLockHeldByOther,
  isEditLockHeldByOther,
  withDocumentEditLocks,
} from './editLock';
import { requireStudent } from './studentGuard';
import {
  canCompletePresentationBlock,
  completePresentationBlock,
  getCurrentPresentation,
  savePresentationBlock,
  submitCurrentPresentation,
} from '../data/presentation';

function error(code: string, message: string, status: number) {
  return HttpResponse.json({ code, message }, { status });
}

function validatePresentationId(id: string | readonly string[] | undefined) {
  if (id !== getCurrentPresentation().id)
    return error('PRESENTATION_NOT_FOUND', '발표 문서를 찾을 수 없어요.', 404);
  return null;
}

export const presentationHandlers = [
  http.get(
    `${API_BASE_URL}${ENDPOINTS.PRESENTATION.CURRENT}`,
    ({ request }) => {
      const student = requireStudent(request, '발표 문서');
      if ('response' in student) return student.response;
      return HttpResponse.json(
        withDocumentEditLocks(
          getCurrentPresentation(),
          'PRESENTATION_CONTENT_BLOCK',
          student.name,
        ),
      );
    },
  ),
  http.patch(
    `${API_BASE_URL}${ENDPOINTS.PRESENTATION.BLOCK(':presentationId', ':blockKey')}`,
    async ({ params, request }) => {
      const student = requireStudent(request, '발표 문서');
      if ('response' in student) return student.response;
      const idError = validatePresentationId(params.presentationId);
      if (idError) return idError;
      const presentation = getCurrentPresentation();
      const block = presentation.blocks.find(
        item => item.key === params.blockKey,
      );
      if (!block)
        return error(
          'PRESENTATION_BLOCK_NOT_FOUND',
          '작성 영역을 찾을 수 없어요.',
          404,
        );
      let input: UpdatePresentationBlockInput;
      try {
        input = (await request.json()) as UpdatePresentationBlockInput;
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
      const currentPresentation = getCurrentPresentation();
      if (currentPresentation.version !== input.version)
        return error(
          'VERSION_CONFLICT',
          '다른 팀원의 저장 내용이 있어 최신 문서를 다시 불러와야 해요.',
          409,
        );
      if (currentPresentation.status === 'SUBMITTED')
        return error(
          'PRESENTATION_SUBMITTED',
          '제출한 발표 문서는 수정할 수 없어요.',
          409,
        );
      const lock = isEditLockHeldByOther(
        {
          targetType: 'PRESENTATION_CONTENT_BLOCK',
          targetId: `${currentPresentation.id}:${params.blockKey}`,
        },
        student.name,
      );
      if (lock)
        return error(
          'BLOCK_LOCKED',
          `${lock.lockedBy}님이 이 영역을 편집 중이에요.`,
          409,
        );
      const saved = savePresentationBlock(
        params.blockKey as PresentationBlockKey,
        input.version,
        input.fields,
        student.name,
      );
      if (!saved)
        return error(
          'VERSION_CONFLICT',
          '다른 팀원의 저장 내용이 있어 최신 문서를 다시 불러와야 해요.',
          409,
        );
      return HttpResponse.json(
        withDocumentEditLocks(
          saved,
          'PRESENTATION_CONTENT_BLOCK',
          student.name,
        ),
      );
    },
  ),
  http.post(
    `${API_BASE_URL}${ENDPOINTS.PRESENTATION.BLOCK_COMPLETION(':presentationId', ':blockKey')}`,
    async ({ params, request }) => {
      const student = requireStudent(request, '발표 문서');
      if ('response' in student) return student.response;
      const idError = validatePresentationId(params.presentationId);
      if (idError) return idError;
      const presentation = getCurrentPresentation();
      const block = presentation.blocks.find(
        item => item.key === params.blockKey,
      );
      if (!block)
        return error(
          'PRESENTATION_BLOCK_NOT_FOUND',
          '작성 영역을 찾을 수 없어요.',
          404,
        );
      let input: CompleteDocumentBlockInput;
      try {
        input = (await request.json()) as CompleteDocumentBlockInput;
      } catch {
        return error(
          'INVALID_REQUEST',
          '완료 처리 요청 형식이 올바르지 않아요.',
          400,
        );
      }
      if (typeof input?.version !== 'number')
        return error('INVALID_REQUEST', '버전 정보가 필요해요.', 400);
      const currentPresentation = getCurrentPresentation();
      if (currentPresentation.version !== input.version)
        return error(
          'VERSION_CONFLICT',
          '최신 문서를 다시 불러와야 해요.',
          409,
        );
      if (currentPresentation.status === 'SUBMITTED')
        return error(
          'PRESENTATION_SUBMITTED',
          '제출한 발표 문서는 완료 처리할 수 없어요.',
          409,
        );
      const currentBlock = currentPresentation.blocks.find(
        item => item.key === params.blockKey,
      )!;
      const lock = isEditLockHeldByOther(
        {
          targetType: 'PRESENTATION_CONTENT_BLOCK',
          targetId: `${currentPresentation.id}:${params.blockKey}`,
        },
        student.name,
      );
      if (lock)
        return error(
          'BLOCK_LOCKED',
          `${lock.lockedBy}님이 이 영역을 편집 중이에요.`,
          409,
        );
      if (!canCompletePresentationBlock(currentBlock)) {
        const message =
          currentBlock.key === 'presentation-material'
            ? '발표 자료 파일을 제출한 뒤 완료 처리해 주세요.'
            : '모든 항목을 작성한 뒤 완료 처리해 주세요.';
        return error('BLOCK_INCOMPLETE', message, 422);
      }
      const completed = completePresentationBlock(
        params.blockKey as PresentationBlockKey,
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
        withDocumentEditLocks(
          completed,
          'PRESENTATION_CONTENT_BLOCK',
          student.name,
        ),
      );
    },
  ),
  http.post(
    `${API_BASE_URL}${ENDPOINTS.PRESENTATION.SUBMIT(':presentationId')}`,
    async ({ params, request }) => {
      const student = requireStudent(request, '발표 문서');
      if ('response' in student) return student.response;
      const idError = validatePresentationId(params.presentationId);
      if (idError) return idError;
      let input: SubmitDocumentSessionInput;
      try {
        input = (await request.json()) as SubmitDocumentSessionInput;
      } catch {
        return error(
          'INVALID_REQUEST',
          '제출 요청 형식이 올바르지 않아요.',
          400,
        );
      }
      if (typeof input?.version !== 'number')
        return error('INVALID_REQUEST', '버전 정보가 필요해요.', 400);
      const presentation = getCurrentPresentation();
      if (presentation.version !== input.version)
        return error(
          'VERSION_CONFLICT',
          '최신 문서를 다시 불러와야 해요.',
          409,
        );
      if (presentation.status === 'SUBMITTED')
        return error(
          'PRESENTATION_SUBMITTED',
          '이미 제출한 발표 문서예요.',
          409,
        );
      if (presentation.teamLeaderName !== student.name)
        return error('FORBIDDEN', '팀장만 발표 문서를 제출할 수 있어요.', 403);
      const lock = findDocumentEditLockHeldByOther(
        'PRESENTATION_CONTENT_BLOCK',
        presentation.id,
        presentation.blocks.map(block => block.key),
        student.name,
      );
      if (lock)
        return error(
          'DOCUMENT_LOCKED',
          `${lock.lockedBy}님이 문서 영역을 편집 중이에요.`,
          409,
        );
      if (presentation.blocks.some(block => block.status !== 'COMPLETED'))
        return error(
          'PRESENTATION_INCOMPLETE',
          '모든 작성 영역을 완료 처리해 주세요.',
          422,
        );
      const submitted = submitCurrentPresentation(input.version, student.name);
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
