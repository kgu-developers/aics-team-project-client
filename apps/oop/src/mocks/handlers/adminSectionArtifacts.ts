import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import ExcelJS from 'exceljs';
import { http, HttpResponse } from 'msw';

import { getMockAuthenticatedAccount } from '../authSession';
import { adminSectionArtifactSummariesBySection } from '../data/adminSectionArtifacts';
import { getAdminSection } from '../data/adminSections';

function guardAdmin(request: Request, sectionId: string) {
  const account = getMockAuthenticatedAccount(request);

  if (!account) {
    return HttpResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 });
  }

  if (
    account.user.globalRole === 'STUDENT' ||
    !account.user.sections.some(section => String(section.id) === sectionId)
  ) {
    return HttpResponse.json(
      { code: 'SECTION_ARTIFACT_ACCESS_DENIED' },
      { status: 403 },
    );
  }

  return null;
}

function getAsOf(request: Request) {
  return new URL(request.url).searchParams.get('asOf') ?? '2026-10-03';
}

async function createArtifactWorkbook(sectionId: string, asOf: string) {
  const workbook = new ExcelJS.Workbook();
  const summarySheet = workbook.addWorksheet('팀별 요약');
  const detailSheet = workbook.addWorksheet('단계별 제출 현황');
  const section = getAdminSection(Number(sectionId));
  const sectionName = section?.code ?? `분반 ${sectionId}`;
  const summaries = adminSectionArtifactSummariesBySection[sectionId] ?? [];

  summarySheet.addRow([
    '분반',
    '팀',
    '팀원',
    '회의록 수',
    '회의록 수정 로그 수',
    '제출 이력 단계 수',
    '마감된 미제출 단계 수',
  ]);
  summaries.forEach(summary => {
    summarySheet.addRow([
      sectionName,
      summary.teamName,
      summary.members
        .map(member => `${member.studentNumber} ${member.name}`)
        .join(', '),
      summary.meetingRecordCount,
      summary.meetingRecordEditCount,
      summary.submittedStageCount,
      summary.overdueMissingStageCount,
    ]);
  });

  detailSheet.addRow([
    '분반',
    '팀',
    '팀원',
    '단계',
    '마감 시각',
    '상태',
    '첫 제출',
    '최신 제출',
    '최신 버전',
    '최초 제출 지각 여부',
    '최신 파일 수',
    '최신 이미지 수',
    '전체 파일 용량',
  ]);
  summaries.forEach(summary => {
    detailSheet.addRow([
      sectionName,
      summary.teamName,
      summary.members
        .map(member => `${member.studentNumber} ${member.name}`)
        .join(', '),
      '제안서',
      `${asOf}T23:59:59`,
      'SUBMITTED',
      `${asOf}T10:00:00`,
      `${asOf}T10:00:00`,
      1,
      'N',
      1,
      0,
      1024,
    ]);
  });

  return workbook.xlsx.writeBuffer();
}

export const adminSectionArtifactHandlers = [
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_ARTIFACT_SUMMARY(':sectionId')}`,
    ({ params, request }) => {
      const sectionId = String(params.sectionId);
      const errorResponse = guardAdmin(request, sectionId);
      if (errorResponse) return errorResponse;

      const section = getAdminSection(Number(sectionId));
      if (!section) {
        return HttpResponse.json(
          { code: 'SECTION_NOT_FOUND' },
          { status: 404 },
        );
      }

      return HttpResponse.json({
        asOf: getAsOf(request),
        contents: adminSectionArtifactSummariesBySection[sectionId] ?? [],
        sectionId: section.id,
        sectionName: section.code,
      });
    },
  ),
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_ARTIFACT_DOWNLOAD(':sectionId')}`,
    async ({ params, request }) => {
      const sectionId = String(params.sectionId);
      const errorResponse = guardAdmin(request, sectionId);
      if (errorResponse) return errorResponse;

      const section = getAdminSection(Number(sectionId));
      if (!section) {
        return HttpResponse.json(
          { code: 'SECTION_NOT_FOUND' },
          { status: 404 },
        );
      }
      const asOf = getAsOf(request);
      const workbook = await createArtifactWorkbook(sectionId, asOf);

      return HttpResponse.arrayBuffer(workbook, {
        headers: {
          'Cache-Control': 'no-store',
          'Content-Disposition': `attachment; filename*=UTF-8''OOP-01-%EC%82%B0%EC%B6%9C%EB%AC%BC-${asOf}.xlsx`,
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });
    },
  ),
];
