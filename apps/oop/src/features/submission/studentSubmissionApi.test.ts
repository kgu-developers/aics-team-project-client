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
  it('HTTP 파일 주소는 요청 전에 거절한다', async () => {
    let requested = false;
    server.use(
      http.get('http://files.example.test/file.pdf', () => {
        requested = true;
        return new HttpResponse('%PDF-1.4', {
          headers: { 'Content-Type': 'application/pdf' },
        });
      }),
    );
    await expect(
      fetchStudentSubmissionPreview('http://files.example.test/file.pdf'),
    ).rejects.toThrow('파일 주소');
    expect(requested).toBe(false);
  });
  it('HTTPS에서 HTTP로 리다이렉트되는 파일을 따라가지 않는다', async () => {
    let redirected = false;
    server.use(
      http.get('https://files.example.test/file.pdf', () =>
        HttpResponse.redirect('http://files.example.test/redirected.pdf'),
      ),
      http.get('http://files.example.test/redirected.pdf', () => {
        redirected = true;
        return new HttpResponse('%PDF-1.4', {
          headers: { 'Content-Type': 'application/pdf' },
        });
      }),
    );
    await expect(
      fetchStudentSubmissionPreview('https://files.example.test/file.pdf'),
    ).rejects.toThrow();
    expect(redirected).toBe(false);
  });
  it('HTTPS PDF는 인증 정보를 생략하고 조회한다', async () => {
    server.use(
      http.get('https://files.example.test/file.pdf', ({ request }) => {
        expect(request.credentials).toBe('omit');
        expect(request.headers.has('authorization')).toBe(false);
        return new HttpResponse('%PDF-1.4', {
          headers: { 'Content-Type': 'application/pdf' },
        });
      }),
    );
    const result = await fetchStudentSubmissionPreview(
      'https://files.example.test/file.pdf',
    );
    expect(result.type).toBe('application/pdf');
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

it('상세 조회 도중 AbortSignal을 취소하면 HTTP 요청도 취소한다', async () => {
  let started!: () => void;
  const received = new Promise<void>(resolve => {
    started = resolve;
  });
  let release!: () => void;
  const response = new Promise<void>(resolve => {
    release = resolve;
  });
  server.use(
    http.get(`${API_BASE_URL}/submissions/31`, async () => {
      started();
      await response;
      return HttpResponse.json(studentSubmission);
    }),
  );
  const controller = new AbortController();
  const request = fetchStudentSubmission('31', controller.signal);
  const rejected = expect(request).rejects.toMatchObject({
    code: 'ERR_CANCELED',
  });
  try {
    await received;
    controller.abort();
    await rejected;
  } finally {
    release();
  }
});
