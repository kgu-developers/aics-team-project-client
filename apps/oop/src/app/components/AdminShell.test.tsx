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

const shellState = vi.hoisted(() => ({
  unreadMessageCount: 0,
}));

vi.mock('~/features/admin-message/queries', () => ({
  useAdminMessagesQuery: () => ({
    data: { unreadCount: shellState.unreadMessageCount },
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
    shellState.unreadMessageCount = 0;
    useAuthStore.setState({
      currentUser: demoAdmin,
      isAuthenticated: true,
      sessionRole: 'ASSISTANT',
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    useAuthStore.getState().clearSession();
  });

  it('사이드바 경계 제어로 메뉴를 접고 다시 펼친다', async () => {
    const user = userEvent.setup();

    renderShell();

    const navigation = screen.getByRole('navigation', { name: '관리자 메뉴' });
    await user.click(screen.getByRole('button', { name: '사이드바 접기' }));

    expect(navigation.parentElement).toHaveAttribute('aria-hidden', 'true');
    await user.click(screen.getByRole('button', { name: '사이드바 펼치기' }));

    expect(navigation.parentElement).not.toHaveAttribute('aria-hidden');
  });

  it('관리자 메뉴를 그룹 제목 없이 한 줄 목록으로 표시한다', () => {
    renderShell();

    expect(screen.getByText('OOTeamProject')).toBeVisible();
    [
      '홈',
      '강좌·분반 관리',
      '마일스톤 관리',
      '제출·평가 현황',
      '공지사항',
      '회의록·액션플랜',
      '쪽지함',
    ].forEach(label => {
      expect(screen.getByRole('link', { name: label })).toBeVisible();
    });
    expect(screen.queryByText('프로젝트 관리')).not.toBeInTheDocument();
    expect(screen.queryByText('소통')).not.toBeInTheDocument();
  });

  it('미확인 쪽지가 있으면 쪽지함 탐색 항목에 숫자 배지를 표시한다', () => {
    shellState.unreadMessageCount = 3;

    renderShell();

    const messagesLink = screen.getByRole('link', {
      name: '쪽지함, 미확인 쪽지 3건',
    });
    expect(messagesLink).toHaveTextContent('쪽지함');
    expect(messagesLink).toHaveTextContent('3');
  });

  it('회의록과 액션플랜을 하나의 탐색 항목으로 제공한다', () => {
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
    expect(profile).not.toHaveTextContent(demoAdmin.studentNumber);
    expect(profile).toHaveTextContent('OOP-01');
    expect(profile).toHaveTextContent('assistant@example.com');
    expect(screen.getByRole('button', { name: '비밀번호 변경' })).toBeVisible();
    expect(screen.getByRole('button', { name: '로그아웃' })).toBeVisible();
  });
});
