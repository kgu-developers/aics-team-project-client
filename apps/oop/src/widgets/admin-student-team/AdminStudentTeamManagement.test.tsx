import { API_BASE_URL } from '@aics/api-client';
import { AstryxThemeProvider } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import type { PropsWithChildren } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import AdminStudentTeamManagement from './AdminStudentTeamManagement';

import { demoAdmin, demoAdminAccessToken } from '~/mocks/data/users';
import { adminStudentTeamHandlers } from '~/mocks/handlers/adminStudentTeams';

const server = setupServer(...adminStudentTeamHandlers);
const originalDialogCloseDescriptor = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'close',
);
const originalDialogShowModalDescriptor = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'showModal',
);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });

  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value() {
      this.open = true;
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value() {
      this.open = false;
    },
  });
});
afterEach(() => {
  server.resetHandlers();
  useAuthStore.getState().clearSession();
});
afterAll(() => {
  server.close();

  if (originalDialogShowModalDescriptor) {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      ...originalDialogShowModalDescriptor,
    });
  } else {
    Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  }

  if (originalDialogCloseDescriptor) {
    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
      ...originalDialogCloseDescriptor,
    });
  } else {
    Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
  }
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <AstryxThemeProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </AstryxThemeProvider>
    );
  };
}

function renderPage() {
  useAuthStore.getState().setAccessToken(demoAdminAccessToken);
  useAuthStore.getState().setCurrentUser(demoAdmin);

  return render(<AdminStudentTeamManagement />, { wrapper: createWrapper() });
}

describe('AdminStudentTeamManagement', () => {
  it('팀원 이름을 누르면 수강생 상세 정보를 표시하고 닫은 뒤 원래 버튼으로 포커스를 돌려준다', async () => {
    const user = userEvent.setup();

    renderPage();

    const memberButton = await screen.findByRole('button', {
      name: '김민준',
    });
    await user.click(memberButton);

    const dialog = await screen.findByRole('dialog', {
      name: '김민준 수강생 정보',
    });

    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText('컴퓨터공학과')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: '닫기' })).toHaveFocus();
    await user.keyboard('{Escape}');

    await waitFor(() => expect(memberButton).toHaveFocus());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('목록을 기다리는 동안 로딩 상태를 표시한다', async () => {
    server.use(
      http.get(
        `${API_BASE_URL}/admin/sections/:sectionId/students`,
        async () => {
          await delay(1_000);
          return HttpResponse.json([]);
        },
      ),
    );

    renderPage();

    expect(
      await screen.findByText('수강생과 팀 목록을 불러오는 중입니다.'),
    ).toBeInTheDocument();
  });

  it('수강생 목록이 비어 있으면 빈 상태를 표시한다', async () => {
    server.use(
      http.get(`${API_BASE_URL}/admin/sections/:sectionId/students`, () =>
        HttpResponse.json([]),
      ),
    );

    renderPage();

    expect(
      await screen.findByText('이 분반에 등록된 수강생이 없습니다.'),
    ).toBeInTheDocument();
  });

  it('목록 요청이 실패하면 오류 상태를 표시한다', async () => {
    server.use(
      http.get(`${API_BASE_URL}/admin/sections/:sectionId/students`, () =>
        HttpResponse.json(
          {
            code: 'STUDENT_LOOKUP_FAILED',
            message: '목록을 불러오지 못했습니다.',
          },
          { status: 500 },
        ),
      ),
    );

    renderPage();

    await waitFor(() =>
      expect(
        screen.getByText(
          '목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
        ),
      ).toBeInTheDocument(),
    );
  });
});
