import { API_BASE_URL } from '@aics/api-client';
import type { StudentHomeMilestone } from '@aics/core';
import { AstryxThemeProvider } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';
import {
  SubmissionDialogProvider,
  useSubmissionDialog,
} from '~/features/submission/SubmissionDialogContext';

import FinalReportMaterials from './FinalReportMaterials';
import MilestoneCard from './MilestoneCard';

import { studentSubmissionConsent } from '~/mocks/data/studentSubmissionConsent';
import {
  demoStudent,
  demoPartnerStudent,
  demoAccessToken,
  demoPartnerAccessToken,
} from '~/mocks/data/users';
import { createStudentSubmissionConsentHandlers } from '~/mocks/handlers/studentSubmissionConsent';

vi.mock('@tanstack/react-router', () => ({ useNavigate: () => vi.fn() }));
const server = setupServer();
let client: QueryClient;
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  client.clear();
  server.resetHandlers();
  useAuthStore.getState().clearSession();
});
afterAll(() => server.close());
const milestone: StudentHomeMilestone = {
  id: '21',
  title: '최종보고서',
  period: '제출 기간',
  dueDate: '마감 전',
  status: 'in-progress',
  statusLabel: '제출 완료',
  interaction: 'static',
  isDetailAvailable: false,
  rows: [
    {
      id: 'final-report-submission',
      label: '최종보고서 제출',
      value: 'v2 제출됨',
      tone: 'primary',
      actionLabel: '파일 교체',
    },
  ],
};
function DialogObserver() {
  const { target } = useSubmissionDialog();
  return target ? <p>파일 제출 폼 열림</p> : null;
}
function setup({
  leader = false,
  allConfirmed = false,
  version = 2,
  showFiles = false,
} = {}) {
  const user = leader ? demoStudent : demoPartnerStudent;
  useAuthStore
    .getState()
    .setAccessToken(leader ? demoAccessToken : demoPartnerAccessToken);
  useAuthStore.getState().setCurrentUser(user);
  server.use(
    ...createStudentSubmissionConsentHandlers({
      getSubmission: () => ({
        ...studentSubmissionConsent,
        currentVersion: version,
        status: version ? 'SUBMITTED' : 'NOT_SUBMITTED',
      }),
      initialConfirmations: allConfirmed ? { '20260003': version } : {},
    }),
    http.get(`${API_BASE_URL}/api/v1/oop/teams/7/kickoff`, () =>
      HttpResponse.json({
        id: 7,
        members: [
          { id: 1, studentNumber: demoStudent.studentNumber, isLeader: true },
          {
            id: 2,
            studentNumber: demoPartnerStudent.studentNumber,
            isLeader: false,
          },
        ],
      }),
    ),
    http.get(`${API_BASE_URL}/submissions/41/versions`, () =>
      HttpResponse.json({
        contents: version
          ? [
              {
                id: 1,
                version,
                submittedBy: { userId: '20260001', name: '팀장' },
                submittedAt: '2026-09-10T09:00:00',
                updatedAt: '2026-09-10T09:00:00',
                late: false,
                artifacts: [],
              },
            ]
          : [],
      }),
    ),
  );
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <AstryxThemeProvider>
      <QueryClientProvider client={client}>
        <SubmissionDialogProvider
          finalReportTargets={{
            '21': {
              sectionId: '1',
              teamId: '7',
              milestoneId: '21',
              studentNumber: user.studentNumber,
              submissionId: '41',
              type: 'FINAL_REPORT',
              title: '최종보고서',
            },
          }}
        >
          <MilestoneCard milestone={milestone} isOpen />
          {showFiles ? (
            <section aria-label='제출 자료 본문'>
              <FinalReportMaterials milestoneId='21' />
            </section>
          ) : null}
          <DialogObserver />
        </SubmissionDialogProvider>
      </QueryClientProvider>
    </AstryxThemeProvider>,
  );
}
it('팀원은 기존 상태 셀의 승인 인원과 CTA만으로 승인·취소한다', async () => {
  setup();
  const actor = userEvent.setup();
  await screen.findByText('승인 1/2명');
  expect(screen.queryByText('v2 제출됨')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('region', { name: '최종보고서 팀원 확인' }),
  ).not.toBeInTheDocument();
  expect(screen.getAllByRole('button')).toHaveLength(1);
  await actor.click(screen.getByRole('button', { name: '승인하기' }));
  await screen.findByText('승인 2/2명');
  await actor.click(screen.getByRole('button', { name: '승인 취소' }));
  await screen.findByText('승인 1/2명');
  expect(screen.queryByText('파일 제출 폼 열림')).not.toBeInTheDocument();
});
it('전원 승인 전 팀장 CTA는 파일 교체를 연다', async () => {
  setup({ leader: true });
  await screen.findByText('승인 1/2명');
  await userEvent.click(screen.getByRole('button', { name: '파일 교체' }));
  expect(await screen.findByText('파일 제출 폼 열림')).toBeVisible();
});
it('전원 승인 후 팀장 CTA가 최종 완료로 전환되고 완료 상태를 표시한다', async () => {
  setup({ leader: true, allConfirmed: true });
  await screen.findByText('승인 2/2명');
  await userEvent.click(screen.getByRole('button', { name: '최종 완료' }));
  await screen.findByText('승인 2/2명 · 완료');
  expect(screen.getByRole('button', { name: '완료' })).toBeDisabled();
  expect(screen.getAllByRole('button')).toHaveLength(1);
});
it('승인 실패 시 기존 CTA로 재조회하고 다시 승인할 수 있다', async () => {
  setup();
  server.use(
    http.put(
      `${API_BASE_URL}/submissions/41/member-confirmations/me`,
      () => new HttpResponse(null, { status: 403 }),
    ),
  );
  await screen.findByText('승인 1/2명');
  await userEvent.click(screen.getByRole('button', { name: '승인하기' }));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: '다시 조회' })).toBeEnabled(),
  );
  await userEvent.click(screen.getByRole('button', { name: '다시 조회' }));
  await screen.findByText('승인 1/2명');
  expect(screen.getByRole('button', { name: '승인하기' })).toBeEnabled();
});
it.each([true, false])(
  '미제출 상태는 팀장 여부 %s에 맞게 제출 또는 대기 CTA를 표시한다',
  async leader => {
    setup({ leader, version: 0 });
    await screen.findByText('미제출');
    const button = screen.getByRole('button', {
      name: leader ? '파일 제출' : '제출 대기',
    });
    if (leader) expect(button).toBeEnabled();
    else expect(button).toBeDisabled();
  },
);
it('본문에는 교체 버튼 없이 파일과 이력만 표시한다', async () => {
  setup({ leader: true, showFiles: true });
  await screen.findByText('승인 1/2명');
  const body = screen.getByRole('region', { name: '제출 자료 본문' });
  expect(
    within(body).queryByRole('button', { name: '파일 교체' }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: '파일 교체' })).toBeEnabled();
});
