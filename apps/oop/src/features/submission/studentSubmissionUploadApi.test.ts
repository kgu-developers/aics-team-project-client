import { Blob as NodeBlob, File as NodeFile } from 'node:buffer';

import {
  API_BASE_URL,
  fetchRequiredSubmissionArtifacts,
  submitStudentSubmissionVersion,
} from '@aics/api-client';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { studentSubmission } from '~/mocks/data/studentSubmissionScenarios';
const server = setupServer();
beforeAll(async () => {
  const nativeForm = await new Response('', {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  }).formData();
  vi.stubGlobal('FormData', nativeForm.constructor);
  vi.stubGlobal('Blob', NodeBlob);
  vi.stubGlobal('File', NodeFile);
  server.listen({ onUnhandledRequest: 'error' });
});
afterEach(() => server.resetHandlers());
afterAll(() => {
  server.close();
  vi.unstubAllGlobals();
});
describe('실제 multipart 파일 제출 계약', () => {
  it('파일 원문과 산출물 ID 순서, JSON 링크 파트를 전송한다', async () => {
    let bodyReceived = false;
    server.use(
      http.post(
        `${API_BASE_URL}/submissions/31/versions`,
        async ({ request }) => {
          expect(request.headers.get('content-type')).toContain(
            'multipart/form-data; boundary=',
          );
          const url = new URL(request.url);
          expect(url.searchParams.getAll('fileArtifactIds')).toEqual([
            '101',
            '102',
          ]);
          expect(url.searchParams.get('description')).toBe('최초 제출');
          const form = await request.formData();
          const files = form.getAll('files') as File[];
          expect(await Promise.all(files.map(file => file.text()))).toEqual([
            'pdf-body',
            'zip-body',
          ]);
          expect(
            JSON.parse(await (form.get('artifacts') as File).text()),
          ).toEqual([
            {
              requiredArtifactId: 103,
              type: 'LINK',
              url: 'https://example.com/demo',
            },
          ]);
          bodyReceived = true;
          return HttpResponse.json(studentSubmission);
        },
      ),
    );
    await submitStudentSubmissionVersion('31', {
      description: '최초 제출',
      files: [
        { requiredArtifactId: 101, file: new File(['pdf-body'], 'report.pdf') },
        { requiredArtifactId: 102, file: new File(['zip-body'], 'code.zip') },
      ],
      artifacts: [
        {
          requiredArtifactId: 103,
          type: 'LINK',
          url: 'https://example.com/demo',
        },
      ],
    });
    expect(bodyReceived).toBe(true);
  });
  it('필수 식별자가 없으면 요청하지 않고 서버 403은 그대로 반환한다', async () => {
    await expect(fetchRequiredSubmissionArtifacts('', '1')).rejects.toThrow(
      '식별자',
    );
    server.use(
      http.post(
        `${API_BASE_URL}/submissions/31/versions`,
        () => new HttpResponse(null, { status: 403 }),
      ),
    );
    await expect(
      submitStudentSubmissionVersion('31', {
        description: '설명',
        files: [],
        artifacts: [],
      }),
    ).rejects.toMatchObject({ response: { status: 403 } });
  });
  it('필수 산출물 응답의 빈 확장자와 null 크기를 보존한다', async () => {
    const rule = {
      id: 1,
      type: 'FILE',
      label: 'PDF',
      required: true,
      allowedExtensions: [],
      maxFileSizeMb: null,
    };
    server.use(
      http.get(
        `${API_BASE_URL}/api/v1/sections/1/milestones/11/required-artifacts`,
        () => HttpResponse.json({ contents: [rule] }),
      ),
    );
    expect(await fetchRequiredSubmissionArtifacts('1', '11')).toEqual([rule]);
  });
});
