import { API_BASE_URL } from '@aics/api-client';
import { AstryxThemeProvider, Button, Text } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { PropsWithChildren } from 'react';
import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import {
  submissionConsentErrorMessage,
  type SubmissionConsentScope,
} from './consentScope';
import { useLiveSubmissionConsent } from './queries';

import {
  studentSubmissionConsent,
  studentSubmissionConsentScope as scope,
} from '~/mocks/data/studentSubmissionConsent';
import {
  demoAccessToken,
  demoStudent,
  demoPartnerAccessToken,
  demoPartnerStudent,
} from '~/mocks/data/users';
import { createStudentSubmissionConsentHandlers } from '~/mocks/handlers/studentSubmissionConsent';

const server = setupServer();
const clients: QueryClient[] = [];
const requests: string[] = [];
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  server.events.on('request:start', ({ request }) => {
    requests.push(`${request.method} ${new URL(request.url).pathname}`);
  });
});
beforeEach(() => {
  useAuthStore.getState().setAccessToken(demoPartnerAccessToken);
  useAuthStore.getState().setCurrentUser(demoPartnerStudent);
  server.use(...createStudentSubmissionConsentHandlers());
});
afterEach(() => {
  clients.splice(0).forEach(client => client.clear());
  server.resetHandlers();
  requests.length = 0;
  useAuthStore.getState().clearSession();
});
afterAll(() => server.close());
function wrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  clients.push(client);
  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <AstryxThemeProvider>
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      </AstryxThemeProvider>
    );
  };
}
function renderPanel(props: ConsentTestControlsProps = scope) {
  return render(<ConsentTestControls {...props} />, {
    wrapper: wrapper(),
  });
}
function renderConsent(value: SubmissionConsentScope = scope) {
  return renderHook(({ value }) => useLiveSubmissionConsent(value, true), {
    wrapper: wrapper(),
    initialProps: { value },
  });
}
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(done => {
    resolve = done;
  });
  return { promise, resolve };
}

it('기본 화면은 현재 버전의 확인 수를 조회하고 최종 완료와 mutation을 활성화하지 않는다', async () => {
  renderPanel();
  expect(await screen.findByText('v2 확인 현황: 1/2명')).toBeVisible();
  expect(screen.getByText('현재 버전의 확인이 필요해요.')).toBeVisible();
  expect(
    screen.queryByRole('button', { name: '현재 버전 확인' }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: '최종 완료' })).toBeDisabled();
  expect(requests.every(request => request.startsWith('GET '))).toBe(true);
});
it('검수용 본인 확인·취소가 현황에 반영되지만 전원 확인도 최종 완료로 표시하지 않는다', async () => {
  const actor = userEvent.setup();
  renderPanel({ ...scope, allowContractActions: true });
  await screen.findByText('v2 확인 현황: 1/2명');
  await actor.click(screen.getByRole('button', { name: '현재 버전 확인' }));
  expect(await screen.findByText('v2 확인 현황: 2/2명')).toBeVisible();
  expect(screen.getByText('현재 버전을 확인했어요.')).toBeVisible();
  expect(screen.getByRole('button', { name: '최종 완료' })).toBeDisabled();
  await actor.click(screen.getByRole('button', { name: '내 확인 취소' }));
  expect(await screen.findByText('v2 확인 현황: 1/2명')).toBeVisible();
  expect(requests.filter(item => item.startsWith('PUT '))).toHaveLength(1);
  expect(requests.filter(item => item.startsWith('DELETE '))).toHaveLength(1);
  expect(requests.some(item => item.includes('/complete'))).toBe(false);
});
it.each([
  'sectionId',
  'teamId',
  'milestoneId',
  'submissionId',
  'studentNumber',
  'currentVersion',
] as const)('%s가 없으면 모든 조회와 확인을 차단한다', async key => {
  const { result } = renderConsent({ ...scope, [key]: undefined });
  await act(async () => {
    await result.current.confirm();
    await result.current.refresh();
  });
  expect(requests).toEqual([]);
  expect(result.current.canChange).toBe(false);
});
it.each(['PROJECT_PROPOSAL', 'PRESENTATION', undefined])(
  '최종보고서가 아닌 %s 문맥은 요청하지 않는다',
  async milestoneType => {
    const { result } = renderConsent({ ...scope, milestoneType });
    await act(async () => {
      await result.current.confirm();
    });
    expect(result.current.state).toBe('unsupported');
    expect(requests).toEqual([]);
  },
);
it('다른 팀의 제출 응답을 확인하면 member-confirmations를 조회하지 않는다', async () => {
  server.use(
    ...createStudentSubmissionConsentHandlers({
      getSubmission: () => ({ ...studentSubmissionConsent, teamId: 8 }),
    }),
  );
  renderPanel({ ...scope, allowContractActions: true });
  await screen.findByRole('alert');
  expect(requests).toEqual(['GET /submissions/41']);
  expect(screen.getByRole('button', { name: '현재 버전 확인' })).toBeDisabled();
});
it('버전 0은 미제출로 표시하고 확인 GET·PUT·DELETE를 차단한다', async () => {
  server.use(
    ...createStudentSubmissionConsentHandlers({
      getSubmission: () => ({
        ...studentSubmissionConsent,
        currentVersion: 0,
        status: 'NOT_SUBMITTED',
      }),
    }),
  );
  renderPanel({ ...scope, currentVersion: 0, allowContractActions: true });
  expect(
    await screen.findByText('아직 최종보고서가 제출되지 않았어요.'),
  ).toBeVisible();
  expect(screen.getByRole('button', { name: '현재 버전 확인' })).toBeDisabled();
  expect(screen.getByRole('button', { name: '내 확인 취소' })).toBeDisabled();
  expect(requests).toEqual(['GET /submissions/41']);
});
it('완료된 제출의 서버 상태를 표시하되 확인 취소를 활성화하지 않는다', async () => {
  server.use(
    ...createStudentSubmissionConsentHandlers({
      getSubmission: () => ({
        ...studentSubmissionConsent,
        status: 'COMPLETED',
      }),
    }),
  );
  renderPanel({ ...scope, allowContractActions: true });
  expect(await screen.findByText('최종 완료된 제출이에요.')).toBeVisible();
  expect(screen.getByRole('button', { name: '현재 버전 확인' })).toBeDisabled();
  expect(screen.getByRole('button', { name: '내 확인 취소' })).toBeDisabled();
});
it.each([401, 403])(
  '확인 요청의 %s 오류를 빈 현황이나 성공으로 표시하지 않고 재조회할 수 있다',
  async status => {
    server.use(
      http.put(`${API_BASE_URL}/submissions/41/member-confirmations/me`, () =>
        HttpResponse.json({ code: 'ACCESS_DENIED' }, { status }),
      ),
    );
    const actor = userEvent.setup();
    renderPanel({ ...scope, allowContractActions: true });
    await screen.findByText('v2 확인 현황: 1/2명');
    await actor.click(screen.getByRole('button', { name: '현재 버전 확인' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      status === 401 ? '로그인' : '권한',
    );
    expect(screen.queryByText('v2 확인 현황: 1/2명')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '현재 버전 확인' }),
    ).toBeDisabled();
    await actor.click(
      screen.getByRole('button', { name: '확인 현황 새로고침' }),
    );
    expect(await screen.findByText('v2 확인 현황: 1/2명')).toBeVisible();
  },
);
it('새 버전 제출 후 이전 확인 수를 숨기고 새 버전으로 재조회한다', async () => {
  let currentVersion = 2;
  server.use(
    ...createStudentSubmissionConsentHandlers({
      getSubmission: () => ({ ...studentSubmissionConsent, currentVersion }),
    }),
  );
  const actor = userEvent.setup();
  const view = renderPanel({ ...scope, allowContractActions: true });
  await screen.findByText('v2 확인 현황: 1/2명');
  await actor.click(screen.getByRole('button', { name: '현재 버전 확인' }));
  await screen.findByText('v2 확인 현황: 2/2명');
  currentVersion = 3;
  view.rerender(
    <ConsentTestControls {...scope} currentVersion={3} allowContractActions />,
  );
  expect(screen.queryByText('v2 확인 현황: 2/2명')).not.toBeInTheDocument();
  expect(await screen.findByText('v3 확인 현황: 1/2명')).toBeVisible();
  expect(screen.getByText('현재 버전의 확인이 필요해요.')).toBeVisible();
});
it('확인 직전 새 버전을 발견하면 PUT 없이 새 자료 확인을 안내한다', async () => {
  let currentVersion = 2;
  server.use(
    ...createStudentSubmissionConsentHandlers({
      getSubmission: () => ({ ...studentSubmissionConsent, currentVersion }),
    }),
  );
  const { result } = renderConsent();
  await waitFor(() => expect(result.current.state).toBe('ready'));
  currentVersion = 3;
  await act(async () => {
    await result.current.confirm();
  });
  expect(result.current.state).toBe('version-changed');
  expect(result.current.snapshot).toBeUndefined();
  expect(requests.some(item => item.startsWith('PUT '))).toBe(false);
});
it('버전 없는 확인 응답을 받은 뒤 새 버전을 발견하면 이전 버전 성공으로 표시하지 않는다', async () => {
  let currentVersion = 2;
  server.use(
    ...createStudentSubmissionConsentHandlers({
      getSubmission: () => ({ ...studentSubmissionConsent, currentVersion }),
    }),
  );
  server.use(
    http.put(`${API_BASE_URL}/submissions/41/member-confirmations/me`, () => {
      currentVersion = 3;
      return HttpResponse.json({
        confirmedCount: 2,
        totalCount: 2,
        isConfirmedByMe: true,
      });
    }),
  );
  const { result } = renderConsent();
  await waitFor(() => expect(result.current.state).toBe('ready'));
  await act(async () => {
    await result.current.confirm();
  });
  expect(result.current.state).toBe('version-changed');
  expect(result.current.snapshot).toBeUndefined();
  expect(result.current.canChange).toBe(false);
});
it('연속 클릭과 과거 콜백은 같은 버전의 mutation을 중복 전송하지 않는다', async () => {
  const gate = deferred();
  let puts = 0;
  server.use(
    http.put(
      `${API_BASE_URL}/submissions/41/member-confirmations/me`,
      async () => {
        puts++;
        await gate.promise;
        return HttpResponse.json({
          confirmedCount: 2,
          totalCount: 2,
          isConfirmedByMe: true,
        });
      },
    ),
  );
  const { result } = renderConsent();
  await waitFor(() => expect(result.current.state).toBe('ready'));
  const confirm = result.current.confirm;
  let first!: Promise<void>;
  act(() => {
    first = confirm();
    void confirm();
  });
  await waitFor(() => expect(puts).toBe(1));
  await act(async () => {
    await confirm();
    gate.resolve();
    await first;
  });
  expect(puts).toBe(1);
});
it('버전 A→B→A 전환 후 늦은 mutation 응답이 현재 결과를 덮거나 취소하지 않는다', async () => {
  const gate = deferred();
  let started = false;
  let currentVersion = 2;
  server.use(
    ...createStudentSubmissionConsentHandlers({
      getSubmission: () => ({ ...studentSubmissionConsent, currentVersion }),
    }),
  );
  server.use(
    http.put(
      `${API_BASE_URL}/submissions/41/member-confirmations/me`,
      async () => {
        started = true;
        await gate.promise;
        return HttpResponse.json({
          confirmedCount: 2,
          totalCount: 2,
          isConfirmedByMe: true,
        });
      },
    ),
  );
  const { result, rerender } = renderConsent();
  await waitFor(() => expect(result.current.state).toBe('ready'));
  const oldConfirm = result.current.confirm;
  let request!: Promise<void>;
  act(() => {
    request = oldConfirm();
  });
  await waitFor(() => expect(started).toBe(true));
  currentVersion = 3;
  rerender({ value: { ...scope, currentVersion: 3 } });
  await waitFor(() => expect(result.current.state).toBe('ready'));
  currentVersion = 2;
  rerender({ value: scope });
  await waitFor(() => expect(result.current.state).toBe('ready'));
  await act(async () => {
    gate.resolve();
    await request;
  });
  expect(result.current.snapshot?.consent?.isConfirmedByMe).toBe(false);
  const puts = requests.filter(item => item.startsWith('PUT ')).length;
  await act(async () => {
    await oldConfirm();
  });
  expect(requests.filter(item => item.startsWith('PUT '))).toHaveLength(puts);
  expect(requests.some(item => item.startsWith('DELETE '))).toBe(false);
});

it('재조회 503 동안 캐시된 확인 수를 표시하지 않고 재시도로 복구한다', async () => {
  const actor = userEvent.setup();
  renderPanel({ ...scope, allowContractActions: true });
  await screen.findByText('v2 확인 현황: 1/2명');
  server.use(
    http.get(
      `${API_BASE_URL}/submissions/41/member-confirmations`,
      () => new HttpResponse(null, { status: 503 }),
    ),
  );
  await actor.click(screen.getByRole('button', { name: '확인 현황 새로고침' }));
  await screen.findByRole('alert');
  expect(screen.queryByText('v2 확인 현황: 1/2명')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: '현재 버전 확인' })).toBeDisabled();
  server.resetHandlers();
  server.use(...createStudentSubmissionConsentHandlers());
  await actor.click(screen.getByRole('button', { name: '확인 현황 새로고침' }));
  expect(await screen.findByText('v2 확인 현황: 1/2명')).toBeVisible();
});

it('현황 GET 도중 새 버전이 생기면 버전 없는 응답을 이전 버전에 붙이지 않는다', async () => {
  let currentVersion = 2;
  server.use(
    ...createStudentSubmissionConsentHandlers({
      getSubmission: () => ({ ...studentSubmissionConsent, currentVersion }),
    }),
  );
  server.use(
    http.get(`${API_BASE_URL}/submissions/41/member-confirmations`, () => {
      currentVersion = 3;
      return HttpResponse.json({
        confirmedCount: 2,
        totalCount: 2,
        isConfirmedByMe: true,
      });
    }),
  );
  renderPanel({ ...scope, allowContractActions: true });
  expect(await screen.findByRole('alert')).toHaveTextContent('현재 제출은 v3');
  expect(screen.queryByText(/확인 현황: /)).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: '현재 버전 확인' })).toBeDisabled();
});
it('계정 전환과 동일 계정 재로그인 시 이전 현황을 즉시 숨기고 새 세션으로 조회한다', async () => {
  const { result, rerender } = renderConsent();
  await waitFor(() => expect(result.current.state).toBe('ready'));
  act(() => {
    useAuthStore.getState().clearSession();
    useAuthStore.getState().setAccessToken(demoAccessToken);
    useAuthStore.getState().setCurrentUser(demoStudent);
  });
  expect(result.current.snapshot).toBeUndefined();
  expect(result.current.state).toBe('unauthenticated');
  rerender({ value: { ...scope, studentNumber: demoStudent.studentNumber } });
  await waitFor(() =>
    expect(result.current.snapshot?.consent?.isConfirmedByMe).toBe(true),
  );
  const before = requests.length;
  act(() => {
    useAuthStore.getState().clearSession();
    useAuthStore.getState().setAccessToken(demoAccessToken);
    useAuthStore.getState().setCurrentUser(demoStudent);
  });
  expect(result.current.snapshot).toBeUndefined();
  await waitFor(() => expect(result.current.state).toBe('ready'));
  expect(requests.length).toBeGreaterThan(before);
});

it('팀장은 전원 확인 후 완료하고 홈과 제출 상세도 완료 상태로 갱신한다', async () => {
  useAuthStore.getState().setAccessToken(demoAccessToken);
  useAuthStore.getState().setCurrentUser(demoStudent);
  server.use(
    ...createStudentSubmissionConsentHandlers({
      initialConfirmations: { '20260003': 2 },
    }),
  );
  const actor = userEvent.setup();
  renderPanel({
    ...scope,
    studentNumber: demoStudent.studentNumber,
    allowContractActions: true,
    isLeader: true,
  });
  await screen.findByText('v2 확인 현황: 2/2명');
  await actor.dblClick(screen.getByRole('button', { name: '최종 완료' }));
  expect(await screen.findByText('최종 완료된 제출이에요.')).toBeVisible();
  expect(screen.getByRole('button', { name: '내 확인 취소' })).toBeDisabled();
  expect(requests.filter(item => item.startsWith('PATCH '))).toHaveLength(1);
  expect(
    clients[0]!.getQueryData([
      'student-submission-api',
      '1',
      '7',
      '20260001',
      '21',
      'detail',
      '41',
    ]),
  ).toMatchObject({ status: 'COMPLETED' });
  expect(
    clients[0]!.getQueryData(['student-home', 'submission', '1', '7', 21]),
  ).toMatchObject({ status: 'COMPLETED' });
});
it.each([403, 428])(
  '완료 요청 %s는 오류를 표시하고 재조회 전 중복 완료를 막는다',
  async status => {
    useAuthStore.getState().setAccessToken(demoAccessToken);
    useAuthStore.getState().setCurrentUser(demoStudent);
    server.use(
      ...createStudentSubmissionConsentHandlers({
        initialConfirmations: { '20260003': 2 },
      }),
    );
    server.use(
      http.patch(
        `${API_BASE_URL}/submissions/41/complete`,
        () => new HttpResponse(null, { status }),
      ),
    );
    const actor = userEvent.setup();
    renderPanel({
      ...scope,
      studentNumber: demoStudent.studentNumber,
      allowContractActions: true,
      isLeader: true,
    });
    await screen.findByText('v2 확인 현황: 2/2명');
    await actor.click(screen.getByRole('button', { name: '최종 완료' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      status === 428 ? '아직 현재 버전을 확인하지 않은 팀원' : '권한이 없어요',
    );
    expect(screen.getByRole('button', { name: '최종 완료' })).toBeDisabled();
    await actor.click(
      screen.getByRole('button', { name: '확인 현황 새로고침' }),
    );
    await screen.findByText('v2 확인 현황: 2/2명');
    expect(screen.getByRole('button', { name: '최종 완료' })).toBeEnabled();
  },
);

// Test-only controls exercise the hook independently of the product CTA.
type ConsentTestControlsProps = SubmissionConsentScope & {
  allowContractActions?: boolean;
  isLeader?: boolean;
};

/** Confirmation applies to the displayed current submission version. */
function ConsentTestControls({
  allowContractActions = false,
  isLeader = false,
  ...scope
}: ConsentTestControlsProps) {
  const consent = useLiveSubmissionConsent(
    scope,
    allowContractActions,
    isLeader,
  );
  const summary = consent.snapshot?.consent;
  const message =
    consent.state === 'unauthenticated'
      ? '현재 학생 로그인 정보와 제출 대상을 확인해 주세요.'
      : consent.state === 'missing-context'
        ? '분반, 팀, 마일스톤과 제출 버전이 확인되면 팀원 확인 현황을 볼 수 있어요.'
        : consent.state === 'unsupported'
          ? '최종보고서의 팀원 확인만 지원해요.'
          : consent.state === 'loading'
            ? '최신 제출 버전과 팀원 확인 현황을 확인하고 있어요.'
            : consent.state === 'not-submitted'
              ? '아직 최종보고서가 제출되지 않았어요.'
              : consent.error
                ? submissionConsentErrorMessage(consent.error)
                : undefined;
  return (
    <div>
      <section aria-label='최종보고서 팀원 확인'>
        {message ? (
          <p role={consent.error ? 'alert' : 'status'}>{message}</p>
        ) : null}
        {summary ? (
          <>
            <Text>
              v{consent.snapshot!.submission.currentVersion} 확인 현황:{' '}
              {summary.confirmedCount}/{summary.totalCount}명
            </Text>
            <Text>
              {summary.isConfirmedByMe
                ? '현재 버전을 확인했어요.'
                : '현재 버전의 확인이 필요해요.'}
            </Text>
          </>
        ) : null}
        {consent.state === 'completed' ? (
          <Text>최종 완료된 제출이에요.</Text>
        ) : (
          <Text>팀원 확인과 최종 완료는 별도 상태예요.</Text>
        )}
        <div>
          <Button
            label='확인 현황 새로고침'
            onClick={() => void consent.refresh()}
            isDisabled={!consent.canRefresh}
            variant='secondary'
          />
          {allowContractActions ? (
            <>
              <Button
                label='현재 버전 확인'
                onClick={() => void consent.confirm()}
                isDisabled={
                  !consent.canChange || Boolean(summary?.isConfirmedByMe)
                }
              />
              <Button
                label='내 확인 취소'
                onClick={() => void consent.cancel()}
                isDisabled={!consent.canChange || !summary?.isConfirmedByMe}
                variant='secondary'
              />
            </>
          ) : null}
          <Button
            label='최종 완료'
            isDisabled={!consent.canComplete}
            onClick={() => void consent.complete()}
          />
        </div>
        <Text color='secondary'>
          모든 팀원이 현재 버전을 확인하면 팀장이 최종 완료할 수 있어요.
        </Text>
      </section>
    </div>
  );
}
