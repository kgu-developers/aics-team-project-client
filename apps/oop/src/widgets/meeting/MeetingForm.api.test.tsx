import { API_BASE_URL, fetchMeetingRecordDetail } from '@aics/api-client';
import { AstryxThemeProvider, ToastViewport } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  expect,
  it,
  vi,
} from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';
import { mapStudentMeeting } from '~/features/meeting/model/studentMeeting';

import { MeetingEditPage, MeetingForm } from './MeetingPages';

import { meetingApiRecord, meetingApiTeam } from '~/mocks/data/meetingApi';
import { demoAccessToken, demoStudent } from '~/mocks/data/users';
import { createLiveEditLockHandlers } from '~/mocks/handlers/liveEditLock';
import { createMeetingApiHandlers } from '~/mocks/handlers/meetingApi';
import { renderWithRouter } from '~/test/renderWithRouter';

const navigate = vi.hoisted(() => vi.fn());
vi.mock('@tanstack/react-router', async importOriginal => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  useNavigate: () => navigate,
}));
const server = setupServer();
const clients: QueryClient[] = [];
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  vi.stubEnv('VITE_ENABLE_MSW', 'false');
  useAuthStore.getState().setAccessToken(demoAccessToken);
  useAuthStore
    .getState()
    .setCurrentUser({ ...demoStudent, teamId: '7', currentTeam: null });
  server.use(...createMeetingApiHandlers(), ...createLiveEditLockHandlers());
});
afterEach(() => {
  clients.splice(0).forEach(client => client.clear());
  server.resetHandlers();
  server.events.removeAllListeners();
  useAuthStore.getState().clearSession();
  vi.unstubAllEnvs();
  navigate.mockReset();
});
afterAll(() => server.close());
const original = mapStudentMeeting(
  { ...meetingApiRecord, id: '19', teamId: '7', location: '301호' },
  [],
  meetingApiTeam,
);

// Exercise the route through real lock queries/mutations and numeric MSW contracts.
function renderForm(record?: typeof original) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  clients.push(client);
  return renderWithRouter(
    <QueryClientProvider client={client}>
      <AstryxThemeProvider>
        {record ? (
          <MeetingForm
            record={record}
            editLock={{
              record,
              canEdit: true,
              pending: false,
              lost: false,
              message: undefined,
              retry: async () => true,
              confirmOwnership: async () => true,
              finish: async () => true,
            }}
          />
        ) : (
          <MeetingEditPage meetingId='19' />
        )}
        <ToastViewport />
      </AstryxThemeProvider>
    </QueryClientProvider>,
  );
}

it('제목만 변경하면 기존 본문·일시·참석자를 보존하고 상세로 돌아간다', async () => {
  const bodies: unknown[] = [];
  server.use(
    http.patch(`${API_BASE_URL}/meeting-records/19`, async ({ request }) => {
      bodies.push(await request.clone().json());
      return undefined;
    }),
  );
  renderForm();
  const title = await screen.findByRole('textbox', { name: /회의 제목/ });
  expect(title).toHaveValue(original.title);
  expect(screen.getByRole('textbox', { name: /회의 시간/ })).toHaveValue(
    '09:30',
  );
  expect(
    screen.getByText('지난 회의의 결정 사항을 확인했습니다.'),
  ).toBeVisible();
  expect(
    screen.queryByRole('button', { name: '액션 추가' }),
  ).not.toBeInTheDocument();
  fireEvent.change(title, { target: { value: '제목만 수정' } });
  await userEvent.click(screen.getByRole('button', { name: '저장' }));
  await waitFor(() =>
    expect(navigate).toHaveBeenCalledWith({
      to: '/student/meetings/$meetingId',
      params: { meetingId: '19' },
    }),
  );
  expect(bodies).toEqual([{ title: '제목만 수정' }]);
  expect(await fetchMeetingRecordDetail('19')).toMatchObject({
    title: '제목만 수정',
    content: meetingApiRecord.content,
    meetingAt: meetingApiRecord.meetingAt,
    participantIds: meetingApiRecord.participantIds,
  });
});

it('단계·일시·장소를 변경하면 화면 입력과 같은 PATCH 값을 전송한다', async () => {
  const bodies: unknown[] = [];
  server.use(
    http.patch(`${API_BASE_URL}/meeting-records/19`, async ({ request }) => {
      bodies.push(await request.clone().json());
      return undefined;
    }),
  );
  renderForm();
  await screen.findByRole('textbox', { name: /회의 제목/ });
  const user = userEvent.setup();
  await user.click(screen.getByRole('combobox', { name: /회의 단계/ }));
  await user.click(screen.getByRole('option', { name: '최종' }));
  const date = screen.getByRole('combobox', { name: /회의 일자/ });
  fireEvent.change(date, { target: { value: '2026-09-08' } });
  fireEvent.blur(date);
  const time = screen.getByRole('textbox', { name: /회의 시간/ });
  fireEvent.change(time, { target: { value: '00:30' } });
  fireEvent.blur(time);
  fireEvent.change(screen.getByRole('textbox', { name: /장소/ }), {
    target: { value: '' },
  });
  await user.click(screen.getByRole('button', { name: '저장' }));
  await waitFor(() => expect(navigate).toHaveBeenCalled());
  expect(bodies).toEqual([
    { phase: 'FINAL', meetingAt: '2026-09-08T00:30:00', location: '' },
  ]);
});

it('400 오류 뒤 초안을 유지하고 입력을 고쳐 재시도할 수 있다', async () => {
  let invalid = true;
  server.use(
    http.patch(`${API_BASE_URL}/meeting-records/19`, () =>
      invalid
        ? HttpResponse.json({ code: 'INVALID_INPUT' }, { status: 400 })
        : undefined,
    ),
  );
  renderForm();
  const title = await screen.findByRole('textbox', { name: /회의 제목/ });
  fireEvent.change(title, { target: { value: '유지할 초안' } });
  await userEvent.click(screen.getByRole('button', { name: '저장' }));
  expect(
    await screen.findByText(
      '회의록을 저장하지 못했어요. 입력 내용을 확인하고 다시 시도해 주세요.',
      { selector: 'p' },
    ),
  ).toBeVisible();
  expect(title).toHaveValue('유지할 초안');
  expect(title).toBeEnabled();
  expect(navigate).not.toHaveBeenCalled();
  invalid = false;
  await userEvent.click(screen.getByRole('button', { name: '저장' }));
  await waitFor(() => expect(navigate).toHaveBeenCalled());
});

it.each([403, 409, 'network'] as const)(
  '%s 오류 뒤 초안을 유지하며 재저장을 막고 저장된 상세로 안내한다',
  async status => {
    const writes = vi.fn();
    server.use(
      http.patch(`${API_BASE_URL}/meeting-records/19`, () => {
        writes();
        return status === 'network'
          ? HttpResponse.error()
          : HttpResponse.json({ code: 'ERROR' }, { status });
      }),
    );
    renderForm();
    const title = await screen.findByRole('textbox', { name: /회의 제목/ });
    fireEvent.change(title, { target: { value: '보존할 수정 초안' } });
    await userEvent.click(screen.getByRole('button', { name: '저장' }));
    expect(
      await screen.findByRole('link', { name: '저장된 회의록 확인' }),
    ).toBeVisible();
    expect(title).toHaveValue('보존할 수정 초안');
    expect(screen.getByRole('button', { name: '저장' })).toBeDisabled();
    expect(
      screen.getByRole('link', { name: '저장된 회의록 확인' }),
    ).toHaveAttribute('href', '/student/meetings/19');
    expect(writes).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
  },
);

it('저장 중 화면을 떠나면 늦은 응답이 상세로 이동시키지 않는다', async () => {
  let respond!: () => void;
  const requestStarted = vi.fn();
  server.use(
    http.patch(`${API_BASE_URL}/meeting-records/19`, async () => {
      requestStarted();
      await new Promise<void>(resolve => {
        respond = resolve;
      });
      return HttpResponse.json(meetingApiRecord);
    }),
  );
  const { unmount } = renderForm();
  fireEvent.change(await screen.findByRole('textbox', { name: /회의 제목/ }), {
    target: { value: '늦은 저장' },
  });
  await userEvent.click(screen.getByRole('button', { name: '저장' }));
  await waitFor(() => expect(requestStarted).toHaveBeenCalled());
  unmount();
  await act(async () => {
    respond();
    await waitFor(() => expect(clients[0]?.isMutating()).toBe(0));
  });
  expect(navigate).not.toHaveBeenCalled();
});

it('원본 단계가 없으면 구체적인 검증 오류를 표시하고 초안을 유지한다', async () => {
  const writes = vi.fn();
  server.use(
    http.patch(`${API_BASE_URL}/meeting-records/19`, () => {
      writes();
      return HttpResponse.error();
    }),
  );
  renderForm({ ...original, phase: undefined });
  const title = await screen.findByRole('textbox', { name: /회의 제목/ });
  fireEvent.change(title, { target: { value: '보존할 제목' } });
  await userEvent.click(screen.getByRole('button', { name: '저장' }));
  expect(
    await screen.findByText(
      '유효한 팀과 회의록 원본, 회의 단계가 필요해요. 상세에서 다시 확인해 주세요.',
      { selector: 'p' },
    ),
  ).toBeVisible();
  expect(title).toHaveValue('보존할 제목');
  expect(screen.getByRole('button', { name: '저장' })).toBeDisabled();
  expect(
    screen.getByRole('link', { name: '저장된 회의록 확인' }),
  ).toBeVisible();
  expect(writes).not.toHaveBeenCalled();
});
