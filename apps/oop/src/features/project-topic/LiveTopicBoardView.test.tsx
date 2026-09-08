import { API_BASE_URL } from '@aics/api-client';
import { AstryxThemeProvider } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { PropsWithChildren } from 'react';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import LiveTopicBoardView, {
  type LiveTopicBoardViewProps,
} from './LiveTopicBoardView';

import { resetMockSessionState } from '~/mocks/authSession';
import { demoAccessToken, demoPartnerAccessToken } from '~/mocks/data/users';
import { createLiveTopicHandlers } from '~/mocks/handlers/liveTopic';

const candidatesUrl = `${API_BASE_URL}/api/v1/teams/7/topic-candidates`;
const kickoffUrl = `${API_BASE_URL}/api/v1/oop/teams/7/kickoff`;
const defaultProps: LiveTopicBoardViewProps = {
  sectionId: '1',
  teamId: '7',
  studentNumber: '20260001',
  eligibility: { status: 'open' },
};
const kickoff = {
  id: 7,
  name: '4팀',
  members: [
    {
      id: 101,
      studentNumber: '20260001',
      name: '데모 학생 A',
      isLeader: false,
    },
    { id: 102, studentNumber: '20260003', name: '데모 학생 B', isLeader: true },
    {
      id: 103,
      studentNumber: '20260004',
      name: '데모 학생 C',
      isLeader: false,
    },
  ],
};
const server = setupServer();
const clients: QueryClient[] = [];
let requests: string[] = [];

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  server.events.on('request:start', ({ request }) =>
    requests.push(`${request.method} ${new URL(request.url).pathname}`),
  );
});
beforeEach(() => {
  requests = [];
  resetMockSessionState();
  useAuthStore.getState().setAccessToken(demoAccessToken);
  server.use(
    ...createLiveTopicHandlers(),
    http.get(kickoffUrl, () => HttpResponse.json(kickoff)),
  );
});
afterEach(() => {
  server.resetHandlers();
  useAuthStore.getState().clearSession();
  clients.forEach(client => client.clear());
  clients.length = 0;
});
afterAll(() => server.close());

function wrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
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
async function ready() {
  await screen.findByRole('radio', { name: '도서 대여 관리' });
  await waitFor(() =>
    expect(screen.getByRole('button', { name: '새 후보 추가' })).toBeEnabled(),
  );
}
async function fillCandidate() {
  const user = userEvent.setup();
  await ready();
  await user.click(screen.getByRole('button', { name: '새 후보 추가' }));
  await user.type(
    screen.getByRole('textbox', { name: '후보 제목' }),
    '  일정 관리  ',
  );
  await user.type(
    screen.getByRole('textbox', { name: '후보 설명' }),
    '  팀 일정을 관리합니다.  ',
  );
  return user;
}

describe('LiveTopicBoardView', () => {
  it('후보 201 등록과 투표 변경·204 취소 후 재조회 결과를 표시한다', async () => {
    render(<LiveTopicBoardView {...defaultProps} />, { wrapper: wrapper() });
    const user = await fillCandidate();
    // A submit may occur twice before React rerenders. Only one write is sent.
    const form = screen
      .getByRole('textbox', { name: '후보 제목' })
      .closest('form')!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    const own = await screen.findByRole('radio', { name: '일정 관리' });
    expect(own).toBeDisabled();
    expect(
      screen.getByText('제안자 데모 학생 B · 도서와 대여 현황을 관리합니다.'),
    ).toBeInTheDocument();
    expect(
      requests.filter(
        request => request === 'POST /api/v1/teams/7/topic-candidates',
      ),
    ).toHaveLength(1);
    const first = screen.getByRole('radio', { name: '도서 대여 관리' });
    await waitFor(() => expect(first).toBeEnabled());
    await user.click(first);
    await waitFor(() => expect(first).toBeChecked());
    expect(screen.getByText('총 1표')).toBeInTheDocument();
    const second = screen.getByRole('radio', { name: '카페 주문 관리' });
    await waitFor(() => expect(second).toBeEnabled());
    await user.click(second);
    await waitFor(() => expect(second).toBeChecked());
    expect(first).not.toBeChecked();
    expect(screen.getByText('총 1표')).toBeInTheDocument();
    const cancel = screen.getByRole('button', {
      name: '선택한 후보 투표 취소',
    });
    await waitFor(() => expect(cancel).toBeEnabled());
    await user.click(cancel);
    await waitFor(() => expect(second).not.toBeChecked());
    expect(screen.getByText('총 0표')).toBeInTheDocument();
    expect(
      requests.filter(request =>
        request.startsWith('POST /api/v1/topic-candidates'),
      ),
    ).toEqual([
      'POST /api/v1/topic-candidates/1/vote',
      'POST /api/v1/topic-candidates/2/vote',
    ]);
    expect(requests.filter(request => request.startsWith('DELETE '))).toEqual([
      'DELETE /api/v1/topic-candidates/2/vote',
    ]);
    expect(requests.some(request => request.includes('/sections/'))).toBe(
      false,
    );
  });

  it('키보드로 후보를 선택하고 취소할 수 있다', async () => {
    const user = userEvent.setup();
    render(<LiveTopicBoardView {...defaultProps} />, { wrapper: wrapper() });
    await ready();
    await user.tab();
    const first = screen.getByRole('radio', { name: '도서 대여 관리' });
    expect(first).toHaveFocus();
    await user.keyboard(' ');
    await waitFor(() => expect(first).toBeChecked());
    await waitFor(() => expect(first).toBeEnabled());
    await user.tab();
    const cancel = screen.getByRole('button', {
      name: '선택한 후보 투표 취소',
    });
    expect(cancel).toHaveFocus();
    await user.keyboard('{Enter}');
    await waitFor(() => expect(first).not.toBeChecked());
  });

  it('저장은 성공했어도 최신 목록 조회가 실패하면 다음 쓰기를 막는다', async () => {
    let failedRead = false;
    server.use(
      http.get(candidatesUrl, () =>
        failedRead
          ? new HttpResponse(null, { status: 503 })
          : HttpResponse.json({
              contents: [
                {
                  id: 1,
                  proposerUserId: '20260003',
                  title: '도서 대여 관리',
                  description: '도서와 대여 현황을 관리합니다.',
                  voteCount: 0,
                  votedByMe: false,
                },
              ],
            }),
      ),
      http.post(`${API_BASE_URL}/api/v1/topic-candidates/1/vote`, () => {
        failedRead = true;
        return HttpResponse.json(
          { id: 1, candidateId: 1, voterUserId: '20260001' },
          { status: 201 },
        );
      }),
    );
    render(<LiveTopicBoardView {...defaultProps} />, { wrapper: wrapper() });
    await ready();
    await userEvent
      .setup()
      .click(screen.getByRole('radio', { name: '도서 대여 관리' }));
    await screen.findByText(
      '최신 투표 현황을 확인하지 못했어요. 다시 불러온 뒤 참여해 주세요.',
    );
    expect(
      screen.getByRole('radio', { name: '도서 대여 관리' }),
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: '새 후보 추가' })).toBeDisabled();
    expect(
      requests.filter(request => request.startsWith('POST ')),
    ).toHaveLength(1);
  });

  it('다른 학생으로 바꾸면 본인 표시를 다시 조회하고 두 학생의 표를 합산한다', async () => {
    const user = userEvent.setup();
    const view = render(<LiveTopicBoardView {...defaultProps} />, {
      wrapper: wrapper(),
    });
    await ready();
    await user.click(screen.getByRole('radio', { name: '도서 대여 관리' }));
    await waitFor(() =>
      expect(
        screen.getByRole('radio', { name: '도서 대여 관리' }),
      ).toBeChecked(),
    );
    useAuthStore.getState().setAccessToken(demoPartnerAccessToken);
    view.rerender(
      <LiveTopicBoardView {...defaultProps} studentNumber='20260003' />,
    );
    await waitFor(() =>
      expect(
        screen.getByRole('radio', { name: '도서 대여 관리' }),
      ).toBeDisabled(),
    );
    expect(
      screen.getByRole('radio', { name: '도서 대여 관리' }),
    ).not.toBeChecked();
    const other = screen.getByRole('radio', { name: '카페 주문 관리' });
    await waitFor(() => expect(other).toBeEnabled());
    await user.click(other);
    await waitFor(() => expect(other).toBeChecked());
    expect(screen.getByText('총 2표')).toBeInTheDocument();
    view.unmount();
    render(<LiveTopicBoardView {...defaultProps} studentNumber='20260003' />, {
      wrapper: wrapper(),
    });
    await waitFor(() =>
      expect(
        screen.getByRole('radio', { name: '카페 주문 관리' }),
      ).toBeChecked(),
    );
    expect(screen.getByText('총 2표')).toBeInTheDocument();
  });

  it.each([400, 403, 409])(
    '%s 등록 실패에서 입력을 보존하고 성공으로 표시하지 않는다',
    async status => {
      server.use(
        http.post(candidatesUrl, () =>
          HttpResponse.json({ code: 'REJECTED' }, { status }),
        ),
      );
      render(<LiveTopicBoardView {...defaultProps} />, { wrapper: wrapper() });
      const user = await fillCandidate();
      await user.click(screen.getByRole('button', { name: '후보 추가' }));
      await screen.findByRole('alert');
      expect(screen.getByRole('textbox', { name: '후보 제목' })).toHaveValue(
        '  일정 관리  ',
      );
      expect(screen.getByRole('textbox', { name: '후보 설명' })).toHaveValue(
        '  팀 일정을 관리합니다.  ',
      );
      expect(
        screen.queryByText('주제 후보를 추가했어요.'),
      ).not.toBeInTheDocument();
      expect(
        requests.filter(request => request.startsWith('POST ')),
      ).toHaveLength(1);
    },
  );

  it('응답을 잃은 등록은 재전송하지 않고 GET에서 반영 여부를 확인한다', async () => {
    let committed = false;
    server.use(
      http.post(candidatesUrl, () => {
        committed = true;
        return new HttpResponse(null, { status: 502 });
      }),
      http.get(candidatesUrl, () =>
        HttpResponse.json({
          contents: committed
            ? [
                {
                  id: 3,
                  title: '일정 관리',
                  description: '팀 일정을 관리합니다.',
                  proposerUserId: '20260001',
                  voteCount: 0,
                  votedByMe: false,
                },
              ]
            : [],
        }),
      ),
    );
    render(<LiveTopicBoardView {...defaultProps} />, { wrapper: wrapper() });
    const user = userEvent.setup();
    const open = await screen.findByRole('button', { name: '새 후보 추가' });
    await waitFor(() => expect(open).toBeEnabled());
    await user.click(open);
    await user.type(
      screen.getByRole('textbox', { name: '후보 제목' }),
      '일정 관리',
    );
    await user.type(
      screen.getByRole('textbox', { name: '후보 설명' }),
      '팀 일정을 관리합니다.',
    );
    await user.click(screen.getByRole('button', { name: '후보 추가' }));
    const check = await screen.findByRole('button', { name: '요청 결과 확인' });
    expect(screen.getByRole('button', { name: '후보 추가' })).toBeDisabled();
    await waitFor(() => expect(check).toBeEnabled());
    await user.click(check);
    await screen.findByText(
      '최신 목록을 불러왔어요. 내 후보와 투표 결과를 확인해 주세요.',
    );
    expect(screen.getByRole('radio', { name: '일정 관리' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: '후보 제목' })).toHaveValue(
      '일정 관리',
    );
    expect(
      requests.filter(request => request.startsWith('POST ')),
    ).toHaveLength(1);
  });

  it('기간이 미확정이면 읽기는 허용하고 등록·투표 요청을 막는다', async () => {
    const user = userEvent.setup();
    render(<LiveTopicBoardView {...defaultProps} eligibility={undefined} />, {
      wrapper: wrapper(),
    });
    const first = await screen.findByRole('radio', { name: '도서 대여 관리' });
    expect(first).toBeDisabled();
    expect(screen.getByRole('button', { name: '새 후보 추가' })).toBeDisabled();
    expect(
      screen.getByText(
        '주제 참여 기간을 확인한 뒤 후보 등록과 투표를 이용할 수 있어요.',
      ),
    ).toBeInTheDocument();
    await user.click(first);
    await user.click(screen.getByRole('button', { name: '새 후보 추가' }));
    expect(requests.length).toBeGreaterThan(0);
    expect(requests.every(request => request.startsWith('GET '))).toBe(true);
  });

  it.each([
    { teamId: undefined },
    { teamId: '0' },
    { teamId: '9007199254740993' },
    { teamId: '../4' },
    { sectionId: undefined },
    { studentNumber: undefined },
  ])(
    '필수 식별자가 없거나 유효하지 않으면 요청을 보내지 않는다: %o',
    async missing => {
      render(<LiveTopicBoardView {...defaultProps} {...missing} />, {
        wrapper: wrapper(),
      });
      expect(
        screen.getByText('주제 후보를 볼 팀을 확인해 주세요.'),
      ).toBeInTheDocument();
      expect(requests).toEqual([]);
    },
  );

  it('팀원 조회 실패에서도 학번으로 후보를 표시하고 쓰기를 막는다', async () => {
    server.use(
      http.get(kickoffUrl, () => new HttpResponse(null, { status: 403 })),
    );
    render(<LiveTopicBoardView {...defaultProps} />, { wrapper: wrapper() });
    const first = await screen.findByRole('radio', { name: '도서 대여 관리' });
    await screen.findByRole('button', { name: '팀원 정보 다시 불러오기' });
    expect(first).toBeDisabled();
    expect(
      screen.getByText('제안자 20260003 · 도서와 대여 현황을 관리합니다.'),
    ).toBeInTheDocument();
  });

  it('조회 권한 오류를 빈 목록으로 바꾸지 않는다', async () => {
    server.use(
      http.get(candidatesUrl, () => new HttpResponse(null, { status: 401 })),
    );
    render(<LiveTopicBoardView {...defaultProps} />, { wrapper: wrapper() });
    await screen.findByText('로그인한 팀원만 주제 보드를 이용할 수 있어요.');
    expect(screen.queryByText('등록된 후보가 없어요.')).not.toBeInTheDocument();
  });

  it('학생이 바뀌면 이전 입력을 재사용하지 않는다', async () => {
    const view = render(<LiveTopicBoardView {...defaultProps} />, {
      wrapper: wrapper(),
    });
    await fillCandidate();
    view.rerender(
      <LiveTopicBoardView {...defaultProps} studentNumber='20260003' />,
    );
    expect(
      screen.queryByRole('textbox', { name: '후보 제목' }),
    ).not.toBeInTheDocument();
  });
});
