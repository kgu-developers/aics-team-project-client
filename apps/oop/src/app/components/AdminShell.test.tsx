import { AstryxThemeProvider } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  RouterContextProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import AdminShell from './AdminShell';

import { demoAdmin } from '~/mocks/data/users';

function renderShell() {
  const rootRoute = createRootRoute();
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: ['/admin'] }),
    routeTree: rootRoute,
  });

  return render(
    <AstryxThemeProvider>
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: { queries: { retry: false } },
          })
        }
      >
        <RouterContextProvider router={router}>
          <AdminShell />
        </RouterContextProvider>
      </QueryClientProvider>
    </AstryxThemeProvider>,
  );
}

describe('AdminShell', () => {
  beforeEach(() => {
    useAuthStore.setState({
      currentUser: demoAdmin,
      isAuthenticated: true,
      sessionRole: 'ASSISTANT',
    });
  });

  afterEach(() => {
    useAuthStore.getState().clearSession();
  });

  it('관리 메뉴를 기본으로 펼쳐 두고 그룹별로 접을 수 있다', async () => {
    const user = userEvent.setup();

    renderShell();

    const courseManagement = screen.getByRole('button', {
      name: '강좌 관리',
    });
    expect(courseManagement).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: '강좌·분반 관리' })).toBeVisible();
    expect(
      screen.getByRole('button', { name: '프로젝트 관리' }),
    ).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: '팀 협업' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );

    await user.click(courseManagement);

    expect(courseManagement).toHaveAttribute('aria-expanded', 'false');
  });

  it('푸터에 학생 화면과 같은 문의 링크와 카피라이트를 표시한다', () => {
    renderShell();

    const logo = screen.getByRole('img', { name: '경기대학교' });
    const contact = screen.getByRole('link', { name: '문의하기' });
    const copyright = screen.getByText(
      '© 2026 KGU Developers CSHOME. All rights reserved.',
    );

    expect(logo.compareDocumentPosition(contact)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(contact.compareDocumentPosition(copyright)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('사이드바 계정에서 관리자 프로필 팝오버를 연다', async () => {
    const user = userEvent.setup();

    renderShell();

    await user.click(screen.getByRole('button', { name: '내 프로필 열기' }));

    const profile = await screen.findByRole('dialog', { name: '내 프로필' });
    expect(profile).toHaveTextContent('OOP 데모 조교');
    expect(profile).toHaveTextContent('OOP-01');
    expect(profile).toHaveTextContent('assistant@example.com');
    expect(screen.getByRole('button', { name: '비밀번호 변경' })).toBeVisible();
    expect(screen.getByRole('button', { name: '로그아웃' })).toBeVisible();
  });
});
