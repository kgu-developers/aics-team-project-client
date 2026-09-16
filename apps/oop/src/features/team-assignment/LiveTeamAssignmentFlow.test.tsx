import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { AstryxThemeProvider } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

import { useAuthStore } from '~/features/auth/authStore';

import LiveTeamAssignmentFlow from './LiveTeamAssignmentFlow';

import {
  demoOtherSectionAccessToken,
  demoOtherSectionStudent,
} from '~/mocks/data/users';
import { authHandlers } from '~/mocks/handlers/auth';
import { sectionHandlers } from '~/mocks/handlers/section';
import {
  resetTeamAssignmentMockData,
  teamAssignmentHandlers,
  teamAssignmentUserHandlers,
} from '~/mocks/handlers/teamAssignment';

vi.mock('@tanstack/react-router', () => ({ useNavigate: () => vi.fn() }));
vi.mock('~/shared/config/developmentMode', () => ({
  isMockDevelopmentMode: () => false,
}));

const server = setupServer(
  ...authHandlers,
  ...sectionHandlers,
  ...teamAssignmentHandlers,
  ...teamAssignmentUserHandlers,
);
let queryClient: QueryClient;

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  queryClient?.clear();
  server.resetHandlers();
  resetTeamAssignmentMockData();
  useAuthStore.getState().clearSession();
});
afterAll(() => server.close());

function renderFlow() {
  const auth = useAuthStore.getState();
  auth.setAccessToken(demoOtherSectionAccessToken);
  auth.markAuthenticated('STUDENT');
  auth.setCurrentUser(demoOtherSectionStudent);
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <AstryxThemeProvider>
      <QueryClientProvider client={queryClient}>
        <LiveTeamAssignmentFlow />
      </QueryClientProvider>
    </AstryxThemeProvider>,
  );
}

async function fillSurvey() {
  const user = userEvent.setup();
  await user.click(await screen.findByRole('button', { name: '시작하기' }));
  expect(
    screen.getByLabelText('같이 팀을 할 파트너가 있으면 찾아보세요.'),
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '다음 설문' })).toBeDisabled();
  await user.click(screen.getByLabelText('개발'));
  await user.click(screen.getByRole('button', { name: '다음 설문' }));
  await user.type(
    screen.getByLabelText(/프로젝트 주제 아이디어/),
    '팀 일정 서비스',
  );
  await user.click(screen.getByRole('button', { name: '설문 제출' }));
  return user;
}

describe('실 API 모드 설문 흐름', () => {
  it('미제출 조회 후 제출하면 완료 단계로 이동하고 재진입해도 완료 상태를 유지한다', async () => {
    const view = renderFlow();
    const user = await fillSurvey();
    await user.click(
      within(screen.getByRole('dialog', { name: '설문 제출 확인' })).getByRole(
        'button',
        { name: '제출' },
      ),
    );
    expect(
      await screen.findByRole('heading', {
        name: '설문에 응답해 주셔서 감사합니다.',
      }),
    ).toBeVisible();
    expect(
      screen.queryByRole('region', { name: '팀 구성 설문' }),
    ).not.toBeInTheDocument();

    view.unmount();
    queryClient.clear();
    renderFlow();
    expect(
      await screen.findByRole('heading', {
        name: '설문에 응답해 주셔서 감사합니다.',
      }),
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: '시작하기' }),
    ).not.toBeInTheDocument();
  });

  it('제출 후 받은 신청을 승인하면 다른 대기 신청은 노출하지 않는다', async () => {
    let accepted = false;
    let acceptCount = 0;
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.TEAM_ASSIGNMENT.MY_SURVEY_RESPONSE}`,
        ({ request }) => {
          const sectionId = Number(
            new URL(request.url).searchParams.get('sectionId'),
          );
          return HttpResponse.json({
            id: 21,
            sectionId,
            userId: demoOtherSectionStudent.studentNumber,
            preferredRoles: ['DEVELOPMENT'],
            topicOpinion: '팀 일정 서비스',
            submittedAt: '2026-09-16T10:00:00Z',
          });
        },
      ),
      http.get(
        `${API_BASE_URL}${ENDPOINTS.TEAM_ASSIGNMENT.RECEIVED_PREFERRED_PEER_REQUESTS(':sectionId')}`,
        () =>
          HttpResponse.json({
            contents: accepted
              ? [
                  {
                    requesterUserId: '20260001',
                    requesterName: '첫 번째 학생',
                    status: 'ACCEPTED',
                  },
                  {
                    requesterUserId: '20260002',
                    requesterName: '두 번째 학생',
                    status: 'PENDING',
                  },
                ]
              : [
                  {
                    requesterUserId: '20260001',
                    requesterName: '첫 번째 학생',
                    status: 'PENDING',
                  },
                ],
          }),
      ),
      http.post(
        `${API_BASE_URL}${ENDPOINTS.TEAM_ASSIGNMENT.ACCEPT_PREFERRED_PEER_REQUEST(':sectionId', ':requesterUserId')}`,
        () => {
          accepted = true;
          acceptCount += 1;
          return HttpResponse.json({
            contents: [
              {
                requesterUserId: '20260001',
                requesterName: '첫 번째 학생',
                status: 'ACCEPTED',
              },
            ],
          });
        },
      ),
    );

    renderFlow();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: '시작하기' }));
    expect(
      screen.getByRole('region', { name: '받은 파트너 신청' }),
    ).toHaveTextContent('첫 번째 학생');
    await user.click(screen.getByRole('button', { name: '승인' }));
    await user.click(
      within(
        screen.getByRole('dialog', { name: '파트너 확정 확인' }),
      ).getByRole('button', { name: '파트너 확정' }),
    );

    await waitFor(() => expect(acceptCount).toBe(1));
    expect(
      await screen.findByRole('heading', {
        name: '설문에 응답해 주셔서 감사합니다.',
      }),
    ).toBeVisible();
    expect(
      screen.queryByRole('region', { name: '받은 파트너 신청' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '파트너 확정' }),
    ).not.toBeInTheDocument();
  });

  it('발신 신청이 수락된 뒤에는 다른 받은 신청을 승인할 수 없다', async () => {
    const confirmedPeerUserId = '20260009';
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.TEAM_ASSIGNMENT.MY_SURVEY_RESPONSE}`,
        ({ request }) => {
          const sectionId = Number(
            new URL(request.url).searchParams.get('sectionId'),
          );
          return HttpResponse.json({
            id: 22,
            sectionId,
            userId: demoOtherSectionStudent.studentNumber,
            preferredRoles: ['DEVELOPMENT'],
            preferredPeerUserId: confirmedPeerUserId,
            preferredPeerStatus: 'ACCEPTED',
            submittedAt: '2026-09-16T10:00:00Z',
          });
        },
      ),
      http.get(
        `${API_BASE_URL}${ENDPOINTS.TEAM_ASSIGNMENT.PRE_SURVEY_CLASSMATES(':sectionId')}`,
        () =>
          HttpResponse.json({
            contents: [{ userId: confirmedPeerUserId, name: '확정된 파트너' }],
          }),
      ),
      http.get(
        `${API_BASE_URL}${ENDPOINTS.TEAM_ASSIGNMENT.RECEIVED_PREFERRED_PEER_REQUESTS(':sectionId')}`,
        () =>
          HttpResponse.json({
            contents: [
              {
                requesterUserId: '20260010',
                requesterName: '추가 신청 학생',
                status: 'PENDING',
              },
            ],
          }),
      ),
    );

    renderFlow();

    expect(
      await screen.findByRole('heading', {
        name: '설문에 응답해 주셔서 감사합니다.',
      }),
    ).toBeVisible();
    expect(
      screen.queryByRole('region', { name: '받은 파트너 신청' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '시작하기' }),
    ).not.toBeInTheDocument();
  });

  it('제출 실패는 입력값을 유지하며 다시 제출할 수 있다', async () => {
    server.use(
      http.post(
        `${API_BASE_URL}${ENDPOINTS.TEAM_ASSIGNMENT.SUBMIT_SURVEY_RESPONSE(':sectionId')}`,
        () => HttpResponse.json({ code: 'SERVER_ERROR' }, { status: 500 }),
      ),
    );
    renderFlow();
    const user = await fillSurvey();
    await user.click(
      within(screen.getByRole('dialog', { name: '설문 제출 확인' })).getByRole(
        'button',
        { name: '제출' },
      ),
    );
    expect(
      await within(
        screen.getByRole('region', { name: '팀 구성 설문' }),
      ).findByRole('alert'),
    ).toHaveTextContent('설문을 제출하지 못했어요.');
    expect(screen.getByLabelText(/프로젝트 주제 아이디어/)).toHaveValue(
      '팀 일정 서비스',
    );
    expect(
      screen.queryByText('설문에 응답해 주셔서 감사합니다.'),
    ).not.toBeInTheDocument();
    server.resetHandlers();
    await user.click(screen.getByRole('button', { name: '설문 제출' }));
    await user.click(
      within(screen.getByRole('dialog', { name: '설문 제출 확인' })).getByRole(
        'button',
        { name: '제출' },
      ),
    );
    expect(
      await screen.findByRole('heading', {
        name: '설문에 응답해 주셔서 감사합니다.',
      }),
    ).toBeVisible();
  });
});
