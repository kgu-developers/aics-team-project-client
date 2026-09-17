import { API_BASE_URL } from '@aics/api-client';
import {
  AstryxThemeProvider,
  Button,
  ToastViewport,
} from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { TopicApiProvider, useTopicApi } from './TopicApiContext';
import TopicCandidateDialog from './TopicCandidateDialog';
import {
  TopicCandidateDialogProvider,
  useTopicCandidateDialog,
} from './TopicCandidateDialogContext';

const url = `${API_BASE_URL}/api/v1/teams/7/topic-candidates`;
const candidate = {
  id: 17,
  proposerUserId: '20260001',
  title: '일정 관리',
  description: '팀 일정 관리 서비스',
};
const server = setupServer(
  http.get(url, () => HttpResponse.json({ contents: [] })),
  http.get(`${API_BASE_URL}/api/v1/teams/7/kickoff`, () =>
    HttpResponse.json({
      id: 7,
      name: '계약 테스트 팀',
      members: [
        { id: 501, studentNumber: '20260001', name: '학생', isLeader: true },
      ],
    }),
  ),
);
let client: QueryClient;
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  client?.clear();
  server.resetHandlers();
});
afterAll(() => server.close());

function Harness() {
  const api = useTopicApi();
  const { setIsOpen } = useTopicCandidateDialog();
  return (
    <>
      <Button
        label='후보 추가 열기'
        isDisabled={!api?.canParticipate || api.busy}
        onClick={() => setIsOpen(true)}
      />
      {api?.boardQuery.data?.candidates.map(item => (
        <p key={item.id}>{item.title}</p>
      ))}
      <TopicCandidateDialog />
    </>
  );
}
async function openAndFill() {
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <AstryxThemeProvider>
      <QueryClientProvider client={client}>
        <ToastViewport>
          <TopicApiProvider
            sectionId='2'
            teamId='7'
            studentNumber='20260001'
            eligibility={{ status: 'open' }}
          >
            <TopicCandidateDialogProvider>
              <Harness />
            </TopicCandidateDialogProvider>
          </TopicApiProvider>
        </ToastViewport>
      </QueryClientProvider>
    </AstryxThemeProvider>,
  );
  const user = userEvent.setup();
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: '후보 추가 열기' }),
    ).toBeEnabled(),
  );
  await user.click(screen.getByRole('button', { name: '후보 추가 열기' }));
  await user.type(screen.getByLabelText('후보 제목'), ` ${candidate.title} `);
  await user.type(
    screen.getByLabelText('후보 설명'),
    ` ${candidate.description} `,
  );
  return user;
}

describe('운영 주제 후보 다이얼로그 계약', () => {
  it('분반 대신 현재 팀 경로로 제목·설명을 보내고 201 응답 후 목록을 갱신한다', async () => {
    let writes = 0;
    server.use(
      http.get(url, () =>
        HttpResponse.json({
          contents: writes
            ? [{ ...candidate, voteCount: 0, votedByMe: false }]
            : [],
        }),
      ),
      http.post(url, async ({ request }) => {
        expect(await request.json()).toEqual({
          title: candidate.title,
          description: candidate.description,
        });
        expect(request.credentials).toBe('include');
        writes += 1;
        return HttpResponse.json(candidate, { status: 201 });
      }),
    );
    const user = await openAndFill();
    await user.click(screen.getByRole('button', { name: '후보 추가' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(await screen.findByText(candidate.title)).toBeVisible();
    expect(screen.getByText('주제 후보를 추가했어요.')).toBeInTheDocument();
    expect(writes).toBe(1);
  });

  it.each(['server-error', 'invalid-success'])(
    '%s이면 성공을 알리지 않고 결과 확인은 GET만 실행한다',
    async failure => {
      let writes = 0;
      let reads = 0;
      server.use(
        http.get(url, () => {
          reads += 1;
          return HttpResponse.json({ contents: [] });
        }),
        http.post(url, () => {
          writes += 1;
          return failure === 'server-error'
            ? new HttpResponse(null, { status: 500 })
            : HttpResponse.json({ message: 'created' }, { status: 201 });
        }),
      );
      const user = await openAndFill();
      await user.click(screen.getByRole('button', { name: '후보 추가' }));
      expect(await screen.findByRole('alert')).toHaveTextContent(
        '등록 결과를 확인하지 못했어요.',
      );
      const check = screen.getByRole('button', { name: '결과 확인' });
      await waitFor(() => expect(check).toBeEnabled());
      const previousReads = reads;
      await user.click(check);
      await waitFor(() => expect(reads).toBeGreaterThan(previousReads));
      expect(writes).toBe(1);
      expect(screen.getByLabelText('후보 제목')).toHaveValue(
        ` ${candidate.title} `,
      );
      expect(
        screen.queryByText('주제 후보를 추가했어요.'),
      ).not.toBeInTheDocument();
    },
  );
});
