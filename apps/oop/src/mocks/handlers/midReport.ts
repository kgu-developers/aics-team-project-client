import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import type {
  CompleteDocumentBlockInput,
  MidReportBlockKey,
  MidReport,
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
  hasRequiredMidReportRevisionChanges,
  saveMidReportBlock,
  submitCurrentMidReport,
} from '../data/midReport';
import { midReportImages } from '../data/midReportImages';

function reportResponse(report: MidReport) {
  return HttpResponse.json({
    ...report,
    id: Number(report.id),
    teamId: 7,
    blocks: report.blocks.map(block => ({
      ...block,
      fields: block.fields.map(field => {
        if (field.key !== 'guiScreens' || !field.value.trim()) return field;
        const rows = JSON.parse(field.value) as Record<string, unknown>[];
        return {
          ...field,
          value: JSON.stringify(
            rows.map(row => {
              const file = midReportImages.find(
                file =>
                  file.id === row.imageFileId &&
                  file.teamId === report.teamId &&
                  file.contentType.startsWith('image/'),
              );
              return file
                ? { ...row, imageName: file.fileName, imageUrl: file.url }
                : row;
            }),
          ),
        };
      }),
      lastEditedByName: block.lastEditedBy,
    })),
  });
}

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
    return reportResponse(
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
      if (
        input.fields.length !== block.fields.length ||
        new Set(input.fields.map(field => field?.key)).size !==
          block.fields.length ||
        input.fields.some(
          field =>
            !field ||
            typeof field.value !== 'string' ||
            !block.fields.some(expected => expected.key === field.key),
        )
      )
        return error(
          'INVALID_MID_REPORT_FIELDS',
          '작성 영역의 필드 형식이 올바르지 않습니다.',
          400,
        );
      const guiField = input.fields.find(field => field.key === 'guiScreens');
      if (guiField) {
        let rows: unknown;
        try {
          rows = JSON.parse(guiField.value);
        } catch {
          return error(
            'INVALID_MID_REPORT_FIELDS',
            'GUI 형식을 확인해 주세요.',
            400,
          );
        }
        if (
          !Array.isArray(rows) ||
          rows.some(row => !row || typeof row !== 'object')
        )
          return error(
            'INVALID_MID_REPORT_FIELDS',
            'GUI 형식을 확인해 주세요.',
            400,
          );
        for (const row of rows) {
          delete row.imageUrl;
          if (row.imageFileId == null) continue;
          if (!Number.isSafeInteger(row.imageFileId))
            return error(
              'INVALID_MID_REPORT_FIELDS',
              '이미지 ID를 확인해 주세요.',
              400,
            );
          const file = midReportImages.find(
            file =>
              file.id === row.imageFileId &&
              file.teamId === currentReport.teamId &&
              file.contentType.startsWith('image/'),
          );
          if (!file)
            return error(
              'MID_REPORT_GUI_IMAGE_NOT_OWNED',
              '현재 팀원이 업로드한 이미지 파일만 연결할 수 있어요.',
              403,
            );
          row.imageName = file.fileName;
        }
        input = {
          ...input,
          fields: input.fields.map(field =>
            field.key === 'guiScreens'
              ? { ...field, value: JSON.stringify(rows) }
              : field,
          ),
        };
      }
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
      return reportResponse(
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
      return reportResponse(
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
      if (!hasRequiredMidReportRevisionChanges())
        return error(
          'MID_REPORT_REVISION_CHANGES_REQUIRED',
          '피드백 대상 영역을 실제로 수정한 뒤 다시 완료해 주세요.',
          422,
        );
      const submitted = submitCurrentMidReport(input.version, student.name);
      if (!submitted)
        return error(
          'VERSION_CONFLICT',
          '최신 문서를 다시 불러와야 해요.',
          409,
        );
      return reportResponse(submitted);
    },
  ),
];
