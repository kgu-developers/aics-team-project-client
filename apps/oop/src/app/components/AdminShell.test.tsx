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
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import AdminShell from './AdminShell';

import { demoAdmin } from '~/mocks/data/users';

const unreadMessageCount = vi.hoisted(() => ({ value: 0 }));

vi.mock('~/features/admin-message/queries', () => ({
  useAdminMessagesQuery: () => ({
    data: { unreadCount: unreadMessageCount.value },
  }),
}));

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
    unreadMessageCount.value = 0;
    useAuthStore.setState({
      currentUser: demoAdmin,
      isAuthenticated: true,
      sessionRole: 'ASSISTANT',
    });
  });

  afterEach(() => {
    useAuthStore.getState().clearSession();
  });

  it('강좌·분반 관리는 바로 노출하고 나머지 관리 메뉴는 그룹별로 접을 수 있다', () => {
    renderShell();

    expect(screen.getByRole('link', { name: '강좌·분반 관리' })).toBeVisible();
    expect(
      screen.queryByRole('button', { name: '강좌 관리' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: '수강생·팀 관리' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '프로젝트 관리' }),
    ).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: '소통' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('link', { name: '공지사항' })).toBeVisible();
  });

  it('미확인 쪽지가 있으면 쪽지함 탐색 항목에 숫자 배지를 표시한다', () => {
    unreadMessageCount.value = 3;

    renderShell();

    const messagesLink = screen.getByRole('link', {
      name: '쪽지함, 미확인 쪽지 3건',
    });
    expect(messagesLink).toHaveTextContent('쪽지함');
    expect(messagesLink).toHaveTextContent('3');
  });

  it('회의록과 액션플랜을 하나의 소통 탐색 항목으로 제공한다', () => {
    renderShell();

    expect(
      screen.getByRole('link', { name: '회의록·액션플랜' }),
    ).toHaveAttribute('href', '/admin/meetings');
    expect(screen.queryByRole('link', { name: '회의록' })).toBeNull();
    expect(screen.queryByRole('link', { name: '액션플랜' })).toBeNull();
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
