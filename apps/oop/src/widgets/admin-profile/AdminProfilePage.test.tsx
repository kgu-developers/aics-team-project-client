import { API_BASE_URL, ENDPOINTS, setApiAccessToken } from '@aics/api-client';
import { AstryxThemeProvider } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
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

import AdminProfilePage from './AdminProfilePage';

import {
  getAdminProfile,
  resetAdminProfileMockData,
} from '~/mocks/data/adminProfile';
import { demoAdmin, demoAdminAccessToken } from '~/mocks/data/users';
import { adminProfileHandlers } from '~/mocks/handlers/adminProfile';

const server = setupServer(...adminProfileHandlers);
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
beforeEach(() => {
  resetAdminProfileMockData();
  setApiAccessToken(demoAdminAccessToken);
  useAuthStore.getState().setAccessToken(demoAdminAccessToken);
  useAuthStore.getState().setCurrentUser(demoAdmin);
});
afterEach(() => {
  server.resetHandlers();
  setApiAccessToken(null);
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

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, retryDelay: 0 } },
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

  return render(<AdminProfilePage />, { wrapper: Wrapper });
}

describe('AdminProfilePage', () => {
  it('이름과 이메일은 읽기 전용으로 표시한다', () => {
    renderPage();

    expect(screen.getByLabelText('이름')).toBeDisabled();
    expect(screen.getByLabelText('이메일')).toBeDisabled();
  });

  it('소개 메시지를 MSW에 저장하고 최신 값을 다시 표시한다', async () => {
    const user = userEvent.setup();
    renderPage();

    const introduction = await screen.findByLabelText('간단한 메시지');
    await waitFor(() => expect(introduction).toBeEnabled());
    const introductionText = '안녕하세요. OOP 팀프로젝트 담당 조교입니다.';
    await user.type(introduction, introductionText);
    expect(screen.getByLabelText('간단한 메시지')).toHaveValue(
      introductionText,
    );
    expect(
      screen.getByRole('button', { name: '저장하기' }),
    ).toBeInTheDocument();
    expect(getAdminProfile().introduction).toBe('');
    await user.click(screen.getByRole('button', { name: '저장하기' }));

    expect(
      await screen.findByText('소개 메시지를 저장했습니다.'),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(getAdminProfile().introduction).toBe(introductionText),
    );
    expect(screen.getByText(introductionText)).toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', { name: '간단한 메시지' }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '수정하기' }));
    expect(screen.getByLabelText('간단한 메시지')).toHaveValue(
      introductionText,
    );
    expect(
      screen.getByRole('button', { name: '저장하기' }),
    ).toBeInTheDocument();
  });

  it('소개 메시지 저장이 실패하면 오류를 표시한다', async () => {
    const user = userEvent.setup();
    server.use(
      http.patch(`${API_BASE_URL}${ENDPOINTS.PROFILE.ME}`, () =>
        HttpResponse.json({ code: 'PROFILE_UPDATE_FAILED' }, { status: 500 }),
      ),
    );
    renderPage();

    await user.type(
      await screen.findByRole('textbox', { name: '간단한 메시지' }),
      '저장에 실패하는 소개 메시지',
    );
    await user.click(screen.getByRole('button', { name: '저장하기' }));

    expect(
      await screen.findByText(
        '소개 메시지를 저장하지 못했습니다. 다시 시도해 주세요.',
      ),
    ).toBeInTheDocument();
  });

  it('Excel 파일만 선택할 수 있고 선택한 파일을 제거할 수 있다', async () => {
    const user = userEvent.setup({ applyAccept: false });
    renderPage();

    await user.click(
      screen.getByRole('button', { name: '학생 명단 파일 선택' }),
    );
    const dialog = screen.getByRole('dialog', { name: '학생 명단 업로드' });
    const fileInput =
      dialog.querySelector<HTMLInputElement>('input[type="file"]');

    if (!fileInput) throw new Error('파일 선택 input을 찾을 수 없습니다.');

    await user.upload(fileInput, new File(['not excel'], 'students.txt'));
    const fileInputTrigger = screen
      .getAllByRole('button', { name: '학생 명단 파일 선택' })
      .find(button => button.getAttribute('aria-invalid') === 'true');

    expect(fileInputTrigger).toBeDefined();

    const excelFile = new File(['excel data'], '1151.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    await user.upload(fileInput, excelFile);
    expect(
      await screen.findByText('1151.xlsx 선택됨 · 아직 업로드되지 않았습니다.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '선택한 파일 제거' }));
    expect(
      screen.queryByText('1151.xlsx 선택됨 · 아직 업로드되지 않았습니다.'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '선택한 파일 제거' }),
    ).not.toBeInTheDocument();
  });

  it('담당 분반이 없으면 파일 선택 버튼을 비활성화하고 이유를 표시한다', () => {
    useAuthStore.setState({ currentUser: { ...demoAdmin, sections: [] } });
    renderPage();

    expect(
      screen.getByRole('button', { name: '학생 명단 파일 선택' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: '팀 구성 명단 파일 선택' }),
    ).toBeDisabled();
    expect(
      screen.getByText('담당 분반이 없어 명단 파일을 선택할 수 없습니다.'),
    ).toBeInTheDocument();
  });
});
