import {
  API_BASE_URL,
  fetchStudentSubmission,
  fetchStudentSubmissionVersion,
  fetchStudentSubmissionPreview,
} from '@aics/api-client';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  studentSubmission,
  studentSubmissionVersions,
} from '~/mocks/data/studentSubmissionScenarios';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('학생 제출 HTTP 경계', () => {
  it.each(['0', '-1', '11x', '1.2', '9007199254740992'])(
    '잘못된 submissionId %s는 상세 GET 전에 거절한다',
    async id => {
      await expect(fetchStudentSubmission(id)).rejects.toThrow(
        '유효한 제출 대상',
      );
    },
  );
  it('mock 규약의 currentVersion 객체를 실제 응답으로 수용하지 않는다', async () => {
    server.use(
      http.get(`${API_BASE_URL}/submissions/11`, () =>
        HttpResponse.json({
          ...studentSubmission,
          currentVersion: studentSubmissionVersions[1],
        }),
      ),
    );
    await expect(fetchStudentSubmission('11')).rejects.toThrow(
      '제출 상태 응답',
    );
  });
  it('배열을 artifact type 문자열로 강제 변환해 수용하지 않는다', async () => {
    server.use(
      http.get(`${API_BASE_URL}/submissions/31/versions/2`, () =>
        HttpResponse.json({
          ...studentSubmissionVersions[1],
          artifacts: [{ type: ['FILE'] }],
        }),
      ),
    );
    await expect(fetchStudentSubmissionVersion('31', 2)).rejects.toThrow(
      '제출 파일 응답',
    );
  });
  it('PDF가 아닌 signed URL 응답은 미리보기에 넣지 않는다', async () => {
    server.use(
      http.get(
        'https://files.example.test/file.pdf',
        () =>
          new HttpResponse('<html>expired</html>', {
            headers: { 'Content-Type': 'text/html' },
          }),
      ),
    );
    await expect(
      fetchStudentSubmissionPreview('https://files.example.test/file.pdf'),
    ).rejects.toThrow();
  });
});
