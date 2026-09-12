import { Blob as NodeBlob, File as NodeFile } from 'node:buffer';

import { API_BASE_URL } from '@aics/api-client';
import { AstryxThemeProvider } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import FinalReportSubmissionPanel from './FinalReportSubmissionPanel';

import {
  studentSubmission,
  studentSubmissionScope,
} from '~/mocks/data/studentSubmissionScenarios';
import { demoStudent } from '~/mocks/data/users';
const server = setupServer();
const clients: QueryClient[] = [];
let posts = 0;
let current = { ...studentSubmission, currentVersion: 0 };
const target = {
  ...studentSubmissionScope,
  title: '파일 제출',
  type: 'FINAL_REPORT' as const,
};
beforeAll(async () => {
  const nativeForm = await new Response('', {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  }).formData();
  vi.stubGlobal('FormData', nativeForm.constructor);
  vi.stubGlobal('Blob', NodeBlob);
  vi.stubGlobal('File', NodeFile);
  server.listen({ onUnhandledRequest: 'error' });
});
beforeEach(() => {
  posts = 0;
  current = { ...studentSubmission, currentVersion: 0 };
  useAuthStore.getState().markAuthenticated('STUDENT');
  useAuthStore.getState().setCurrentUser(demoStudent);
  server.use(
    http.get(`${API_BASE_URL}/api/v1/oop/teams/7/kickoff`, () =>
      HttpResponse.json({
        id: 7,
        members: [
          { id: 1, studentNumber: demoStudent.studentNumber, isLeader: true },
        ],
      }),
    ),
    http.get(`${API_BASE_URL}/submissions/31`, () =>
      HttpResponse.json(current),
    ),
    http.get(`${API_BASE_URL}/submissions/31/versions`, () =>
      HttpResponse.json({ contents: [] }),
    ),
    http.get(
      `${API_BASE_URL}/api/v1/sections/1/milestones/11/required-artifacts`,
      () =>
        HttpResponse.json({
          contents: [
            {
              id: 101,
              type: 'FILE',
              label: '보고서 PDF',
              required: true,
              allowedExtensions: ['pdf'],
              maxFileSizeMb: 1,
            },
          ],
        }),
    ),
    http.post(`${API_BASE_URL}/submissions/31/versions`, () => {
      posts++;
      current = { ...current, currentVersion: current.currentVersion + 1 };
      return HttpResponse.json(current);
    }),
  );
});
afterEach(() => {
  server.resetHandlers();
  useAuthStore.getState().clearSession();
  clients.splice(0).forEach(c => c.clear());
});
afterAll(() => {
  server.close();
  vi.unstubAllGlobals();
});
function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  clients.push(client);
  const view = render(
    <AstryxThemeProvider>
      <QueryClientProvider client={client}>
        <FinalReportSubmissionPanel target={target} />
      </QueryClientProvider>
    </AstryxThemeProvider>,
  );
  return { ...view, client };
}
async function inputFile(container: HTMLElement) {
  await screen.findByLabelText('제출 설명', { exact: false });
  await userEvent.type(
    screen.getByLabelText('제출 설명', { exact: false }),
    '제출 설명',
  );
  const input = container.querySelector('input[type=file]')!;
  fireEvent.change(input, {
    target: {
      files: [
        new File(['%PDF-1.4 test'], 'report.pdf', { type: 'application/pdf' }),
      ],
    },
  });
}
describe('실서버 제출 폼', () => {
  it('최초 파일을 제출하면 새 버전과 성공 메시지를 표시한다', async () => {
    const { container } = setup();
    await inputFile(container);
    fireEvent.submit(container.querySelector('form')!);
    await screen.findByText('파일 제출을 저장했어요. (v1)');
    expect(posts).toBe(1);
    expect(screen.getByRole('button', { name: '파일 재제출' })).toBeEnabled();
  });
  it('기간이 닫혀 있으면 파일 제출을 차단한다', async () => {
    current = { ...current, canSubmitNow: false };
    setup();
    expect(
      await screen.findByRole('button', { name: '파일 제출' }),
    ).toBeDisabled();
    expect(posts).toBe(0);
  });
  it('응답 유실은 자동 재시도하지 않고 결과 확인 전 재제출을 차단한다', async () => {
    server.use(
      http.post(`${API_BASE_URL}/submissions/31/versions`, () => {
        posts++;
        return HttpResponse.error();
      }),
    );
    const { container } = setup();
    await inputFile(container);
    fireEvent.submit(container.querySelector('form')!);
    await screen.findByText(/제출 결과를 확인하지 못했어요/);
    expect(posts).toBe(1);
    expect(screen.getByRole('button', { name: '파일 제출' })).toBeDisabled();
    const confirm = screen.getByRole('button', {
      name: '제출 내역을 확인했어요. 다시 제출 준비',
    });
    expect(confirm).toBeDisabled();
    let historyAvailable = false;
    server.use(
      http.get(`${API_BASE_URL}/submissions/31/versions`, () =>
        historyAvailable
          ? HttpResponse.json({ contents: [] })
          : new HttpResponse(null, { status: 503 }),
      ),
    );
    await userEvent.click(
      screen.getByRole('button', { name: '제출 내역 새로고침' }),
    );
    await screen.findByText('제출 이력을 불러오지 못했어요.');
    expect(confirm).toBeDisabled();
    historyAvailable = true;
    await userEvent.click(
      screen.getByRole('button', { name: '제출 내역 새로고침' }),
    );
    await waitFor(() => expect(confirm).toBeEnabled());
    await userEvent.click(confirm);
    expect(screen.getByRole('button', { name: '파일 제출' })).toBeEnabled();
    expect(posts).toBe(1);
  });
  it('세션이 변경된 뒤 도착한 제출 응답은 현재 계정 캐시에 반영하지 않는다', async () => {
    let release!: () => void;
    let started!: () => void;
    const began = new Promise<void>(r => {
      started = r;
    });
    const gate = new Promise<void>(r => {
      release = r;
    });
    server.use(
      http.post(`${API_BASE_URL}/submissions/31/versions`, async () => {
        started();
        await gate;
        return HttpResponse.json({ ...current, currentVersion: 1 });
      }),
    );
    const { container, client } = setup();
    await inputFile(container);
    fireEvent.submit(container.querySelector('form')!);
    await began;
    act(() => useAuthStore.getState().clearSession());
    await screen.findByText('로그인을 다시 확인해 주세요.');
    release();
    await waitFor(() => expect(client.isMutating()).toBe(0));
    expect(
      client.getQueryData([
        'student-submission-api',
        '1',
        '7',
        '20260001',
        '11',
        'detail',
        '31',
      ]),
    ).toMatchObject({ currentVersion: 0 });
  });
});

it('팀원은 최종보고서 파일을 제출할 수 없다', async () => {
  server.use(
    http.get(`${API_BASE_URL}/api/v1/oop/teams/7/kickoff`, () =>
      HttpResponse.json({
        id: 7,
        members: [
          { id: 1, studentNumber: demoStudent.studentNumber, isLeader: false },
        ],
      }),
    ),
  );
  const { container } = setup();
  await screen.findByText('최종보고서는 팀장만 제출할 수 있어요.');
  expect(screen.getByRole('button', { name: '파일 제출' })).toBeDisabled();
  fireEvent.submit(container.querySelector('form')!);
  expect(posts).toBe(0);
});
