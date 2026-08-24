import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import type {
  CompleteDocumentBlockInput,
  MidReportBlockKey,
  SubmitDocumentSessionInput,
  UpdateMidReportBlockInput,
} from '@aics/core';
import { http, HttpResponse } from 'msw';

import {
  findDocumentEditLockHeldByOther,
  isEditLockHeldByOther,
  withDocumentEditLocks,
} from './editLock';
import { requireStudent } from './studentGuard';
import {
  canCompleteMidReportBlock,
  completeMidReportBlock,
  getCurrentMidReport,
  saveMidReportBlock,
  submitCurrentMidReport,
} from '../data/midReport';

function error(code: string, message: string, status: number) {
  return HttpResponse.json({ code, message }, { status });
}

function validateMidReportId(id: string | readonly string[] | undefined) {
  if (id !== getCurrentMidReport().id)
    return error('MID_REPORT_NOT_FOUND', '중간보고서를 찾을 수 없어요.', 404);
  return null;
}

export const midReportHandlers = [
  http.get(`${API_BASE_URL}${ENDPOINTS.MID_REPORT.CURRENT}`, ({ request }) => {
    const student = requireStudent(request, '중간보고서');
    if ('response' in student) return student.response;
    return HttpResponse.json(
      withDocumentEditLocks(
        getCurrentMidReport(),
        'MID_REPORT_BLOCK',
        student.name,
      ),
    );
  }),
  http.patch(
    `${API_BASE_URL}${ENDPOINTS.MID_REPORT.BLOCK(':midReportId', ':blockKey')}`,
    async ({ params, request }) => {
      const student = requireStudent(request, '중간보고서');
      if ('response' in student) return student.response;
      const idError = validateMidReportId(params.midReportId);
      if (idError) return idError;
      const report = getCurrentMidReport();
      const block = report.blocks.find(item => item.key === params.blockKey);
      if (!block)
        return error(
          'MID_REPORT_BLOCK_NOT_FOUND',
          '작성 영역을 찾을 수 없어요.',
          404,
        );
      let input: UpdateMidReportBlockInput;
      try {
        input = (await request.json()) as UpdateMidReportBlockInput;
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
      const currentReport = getCurrentMidReport();
      if (currentReport.version !== input.version)
        return error(
          'VERSION_CONFLICT',
          '다른 팀원의 저장 내용이 있어 최신 문서를 다시 불러와야 해요.',
          409,
        );
      if (currentReport.status === 'SUBMITTED')
        return error(
          'MID_REPORT_SUBMITTED',
          '제출한 중간보고서는 수정할 수 없어요.',
          409,
        );
      const lock = isEditLockHeldByOther(
        {
          targetType: 'MID_REPORT_BLOCK',
          targetId: `${currentReport.id}:${params.blockKey}`,
        },
        student.name,
      );
      if (lock)
        return error(
          'BLOCK_LOCKED',
          `${lock.lockedBy}님이 이 영역을 편집 중이에요.`,
          409,
        );
      const saved = saveMidReportBlock(
        params.blockKey as MidReportBlockKey,
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
        withDocumentEditLocks(saved, 'MID_REPORT_BLOCK', student.name),
      );
    },
  ),
  http.post(
    `${API_BASE_URL}${ENDPOINTS.MID_REPORT.BLOCK_COMPLETION(':midReportId', ':blockKey')}`,
    async ({ params, request }) => {
      const student = requireStudent(request, '중간보고서');
      if ('response' in student) return student.response;
      const idError = validateMidReportId(params.midReportId);
      if (idError) return idError;
      const report = getCurrentMidReport();
      const block = report.blocks.find(item => item.key === params.blockKey);
      if (!block)
        return error(
          'MID_REPORT_BLOCK_NOT_FOUND',
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
      const currentReport = getCurrentMidReport();
      if (currentReport.version !== input.version)
        return error(
          'VERSION_CONFLICT',
          '최신 문서를 다시 불러와야 해요.',
          409,
        );
      if (currentReport.status === 'SUBMITTED')
        return error(
          'MID_REPORT_SUBMITTED',
          '제출한 중간보고서는 완료 처리할 수 없어요.',
          409,
        );
      const currentBlock = currentReport.blocks.find(
        item => item.key === params.blockKey,
      )!;
      const lock = isEditLockHeldByOther(
        {
          targetType: 'MID_REPORT_BLOCK',
          targetId: `${currentReport.id}:${params.blockKey}`,
        },
        student.name,
      );
      if (lock)
        return error(
          'BLOCK_LOCKED',
          `${lock.lockedBy}님이 이 영역을 편집 중이에요.`,
          409,
        );
      if (!canCompleteMidReportBlock(currentBlock))
        return error(
          'BLOCK_INCOMPLETE',
          '모든 항목을 작성한 뒤 완료 처리해 주세요.',
          422,
        );
      const completed = completeMidReportBlock(
        params.blockKey as MidReportBlockKey,
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
        withDocumentEditLocks(completed, 'MID_REPORT_BLOCK', student.name),
      );
    },
  ),
  http.post(
    `${API_BASE_URL}${ENDPOINTS.MID_REPORT.SUBMIT(':midReportId')}`,
    async ({ params, request }) => {
      const student = requireStudent(request, '중간보고서');
      if ('response' in student) return student.response;
      const idError = validateMidReportId(params.midReportId);
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
      const report = getCurrentMidReport();
      if (report.version !== input.version)
        return error(
          'VERSION_CONFLICT',
          '최신 문서를 다시 불러와야 해요.',
          409,
        );
      if (report.status === 'SUBMITTED')
        return error(
          'MID_REPORT_SUBMITTED',
          '이미 제출한 중간보고서예요.',
          409,
        );
      if (report.teamLeaderName !== student.name)
        return error('FORBIDDEN', '팀장만 중간보고서를 제출할 수 있어요.', 403);
      const lock = findDocumentEditLockHeldByOther(
        'MID_REPORT_BLOCK',
        report.id,
        report.blocks.map(block => block.key),
        student.name,
      );
      if (lock)
        return error(
          'DOCUMENT_LOCKED',
          `${lock.lockedBy}님이 문서 영역을 편집 중이에요.`,
          409,
        );
      if (report.blocks.some(block => block.status !== 'COMPLETED'))
        return error(
          'MID_REPORT_INCOMPLETE',
          '모든 작성 영역을 완료 처리해 주세요.',
          422,
        );
      const submitted = submitCurrentMidReport(input.version, student.name);
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
