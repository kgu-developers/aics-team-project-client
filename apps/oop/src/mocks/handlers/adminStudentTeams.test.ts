// @vitest-environment node

import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import ExcelJS from 'exceljs';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest';

import {
  adminStudentTeamHandlers,
  resetAdminStudentTeamMockState,
} from './adminStudentTeams';
import { resetMockSessionState } from '../authSession';
import { adminTeamsFixture } from '../data/adminStudentTeams';
import { demoAdminAccessToken } from '../data/users';

const server = setupServer(...adminStudentTeamHandlers);
const headers = { Authorization: `Bearer ${demoAdminAccessToken}` };

async function workbookFile(
  name: string,
  rows: readonly (readonly string[])[],
) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('명단');
  rows.forEach(row => worksheet.addRow([...row]));
  const buffer = await workbook.xlsx.writeBuffer();
  return new File([new Uint8Array(buffer)], name, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

async function preview(endpoint: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return fetch(`${API_BASE_URL}${endpoint}`, {
    body: formData,
    headers,
    method: 'POST',
  });
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  resetMockSessionState();
  resetAdminStudentTeamMockState();
});
afterEach(() => {
  server.resetHandlers();
  resetMockSessionState();
});
afterAll(() => server.close());

it('새 분반의 수강생 엑셀을 읽어 미리보기하고 반영한다', async () => {
  const previewResponse = await preview(
    ENDPOINTS.ADMIN.SECTION_ENROLLMENT_IMPORT_PREVIEW('2'),
    await workbookFile('수강생.xlsx', [
      ['학번', '이름', '이메일', '학과'],
      ['20269999', '새학생', 'new@example.com', '컴퓨터공학과'],
    ]),
  );

  const previewBody = (await previewResponse.json()) as {
    code?: string;
    importId: number;
    message?: string;
    rows: Array<{ status: string; studentNumber: string }>;
  };
  expect(previewResponse.status, JSON.stringify(previewBody)).toBe(200);
  expect(previewBody.rows).toEqual([
    expect.objectContaining({ status: 'NEW_USER', studentNumber: '20269999' }),
  ]);

  const applyResponse = await fetch(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.ENROLLMENT_IMPORT_APPLY(previewBody.importId)}`,
    { headers, method: 'POST' },
  );
  expect(applyResponse.status).toBe(200);
});

it('반영된 수강생을 팀 엑셀에서 찾아 미리보기한다', async () => {
  const enrollmentPreview = await preview(
    ENDPOINTS.ADMIN.SECTION_ENROLLMENT_IMPORT_PREVIEW('2'),
    await workbookFile('수강생.xlsx', [
      ['학번', '이름'],
      ['20269999', '새학생'],
    ]),
  );
  const enrollmentBody = (await enrollmentPreview.json()) as {
    importId: number;
  };
  await fetch(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.ENROLLMENT_IMPORT_APPLY(enrollmentBody.importId)}`,
    { headers, method: 'POST' },
  );

  const teamPreview = await preview(
    ENDPOINTS.ADMIN.SECTION_TEAM_IMPORT_PREVIEW('2'),
    await workbookFile('팀.xlsx', [
      ['팀명', '학번', '팀장'],
      ['새 팀', '20269999', 'Y'],
    ]),
  );

  const teamPreviewBody = await teamPreview.json();
  expect(teamPreview.status, JSON.stringify(teamPreviewBody)).toBe(200);
  expect(teamPreviewBody).toMatchObject({
    rows: [
      {
        leader: true,
        status: 'VALID',
        studentNumber: '20269999',
        teamName: '새 팀',
      },
    ],
  });
});

it('팀 엑셀에서 기존 팀원을 다른 팀으로 변경하면 이전 팀의 구성원에서도 제거한다', async () => {
  const previewResponse = await preview(
    ENDPOINTS.ADMIN.SECTION_TEAM_IMPORT_PREVIEW('1'),
    await workbookFile('팀 변경.xlsx', [
      ['팀명', '학번', '팀장'],
      ['2팀', '20231234', ''],
    ]),
  );
  const previewBody = (await previewResponse.json()) as {
    importId: number;
    rows: Array<{ status: string }>;
  };
  expect(previewResponse.status, JSON.stringify(previewBody)).toBe(200);
  expect(previewBody.rows).toEqual([
    expect.objectContaining({ status: 'UPDATE' }),
  ]);

  const applyResponse = await fetch(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.TEAM_IMPORT_APPLY(previewBody.importId)}`,
    { headers, method: 'POST' },
  );
  expect(applyResponse.status).toBe(200);

  expect(
    adminTeamsFixture.find(team => team.id === 'team-1151-1')?.memberIds,
  ).not.toContain('student-1151-1');
  expect(
    adminTeamsFixture.find(team => team.id === 'team-1151-2')?.memberIds,
  ).toContain('student-1151-1');
});
