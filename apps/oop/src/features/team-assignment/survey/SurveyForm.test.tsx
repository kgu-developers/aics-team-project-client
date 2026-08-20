import { AstryxThemeProvider } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import type { PropsWithChildren } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import { SurveyForm } from './SurveyForm';

import { teamAssignmentFixture } from '~/mocks/data/teamAssignment';
import {
  demoAccessToken,
  demoPartnerAccessToken,
  demoPartnerStudent,
  demoStudent,
} from '~/mocks/data/users';
import {
  resetTeamAssignmentMockData,
  teamAssignmentHandlers,
} from '~/mocks/handlers/teamAssignment';

const server = setupServer(...teamAssignmentHandlers);

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close() {
    this.open = false;
  };
  server.listen({ onUnhandledRequest: 'error' });
});
afterEach(() => {
  server.resetHandlers();
  resetTeamAssignmentMockData();
  useAuthStore.getState().clearSession();
});
afterAll(() => server.close());

function renderSurvey(
  accessToken = demoAccessToken,
  currentUser = demoStudent,
  projection = teamAssignmentFixture,
) {
  useAuthStore.getState().setAccessToken(accessToken);
  useAuthStore.getState().setCurrentUser(currentUser);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <AstryxThemeProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </AstryxThemeProvider>
    );
  }
  return render(<SurveyForm projection={projection} />, { wrapper: Wrapper });
}

describe('SurveyForm', () => {
  it('받은 파트너 신청을 처리하기 전에는 다음 설문으로 이탈할 수 없다', async () => {
    const user = userEvent.setup();
    renderSurvey(demoPartnerAccessToken, demoPartnerStudent, {
      ...teamAssignmentFixture,
      incomingPartnerRequest: {
        requester: {
          id: 'student-a',
          name: demoStudent.name,
          studentNumber: demoStudent.studentNumber,
        },
        id: 'request-student-a-to-student-b',
        status: 'pending',
      },
    });

    await user.click(screen.getByRole('button', { name: '시작하기' }));

    expect(
      screen.getByRole('region', { name: '받은 파트너 신청' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('설문을 제출하기 전에 승인 또는 거절을 선택해 주세요.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음 설문' })).toBeDisabled();
  });

  it('이전 단계 버튼을 눌러 이미 지나간 설문 단계로 돌아갈 수 있다', async () => {
    const user = userEvent.setup();
    renderSurvey();

    await user.click(screen.getByRole('button', { name: '시작하기' }));
    await user.click(screen.getByLabelText('개발'));
    await user.click(screen.getByRole('button', { name: '다음 설문' }));

    expect(screen.getByLabelText(/프로젝트 주제 아이디어/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '1. 소개' }));

    expect(
      screen.getByText('팀프로젝트 팀구성을 위한 설문에 응답해 주세요.'),
    ).toBeInTheDocument();
  });

  it('제출 전에 확인 Dialog를 열고 이전 설문 단계로 돌아갈 수 있다', async () => {
    const user = userEvent.setup();
    renderSurvey();

    await user.click(screen.getByRole('button', { name: '시작하기' }));
    await user.click(screen.getByLabelText('개발'));
    await user.click(screen.getByRole('button', { name: '다음 설문' }));
    await user.click(screen.getByRole('button', { name: '설문 제출' }));

    expect(
      screen.getByRole('dialog', { name: '설문 제출 확인' }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: '이전 설문으로 돌아가기' }),
    );

    await waitFor(() =>
      expect(
        screen.getByLabelText('같이 팀을 할 파트너가 있으면 찾아보세요.'),
      ).toBeInTheDocument(),
    );
  });
});
