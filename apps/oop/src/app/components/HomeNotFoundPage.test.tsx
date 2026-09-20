import { AstryxThemeProvider } from '@aics/design-system';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import HomeNotFoundPage from './HomeNotFoundPage';

import { demoAdmin, demoStudent } from '~/mocks/data/users';

afterEach(() => {
  useAuthStore.setState({ accessToken: null, currentUser: null });
});

function renderNotFound() {
  const root = createRootRoute({
    component: Outlet,
    notFoundComponent: HomeNotFoundPage,
  });
  const routes = ['/login', '/student', '/admin'].map(path =>
    createRoute({
      component: () => <div>{path} 도착</div>,
      getParentRoute: () => root,
      path,
    }),
  );
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: ['/abc'] }),
    routeTree: root.addChildren(routes),
  });
  render(
    <AstryxThemeProvider>
      <RouterProvider router={router} />
    </AstryxThemeProvider>,
  );
  return router;
}

it('관리자에게는 관리자 홈 안내와 이동을 제공한다', async () => {
  useAuthStore.setState({ accessToken: 'token', currentUser: demoAdmin });
  const router = renderNotFound();
  await screen.findByRole('heading', { name: '페이지를 찾을 수 없어요.' });
  expect(screen.getByText('현재 관리자 흐름에 없는 주소입니다.')).toBeVisible();
  await userEvent.click(
    screen.getByRole('button', { name: '관리자 홈으로 가기' }),
  );
  await waitFor(() => expect(router.state.location.pathname).toBe('/admin'));
});

it('학생에게는 학생 홈으로 안내한다', async () => {
  useAuthStore.setState({ accessToken: 'token', currentUser: demoStudent });
  renderNotFound();
  expect(
    await screen.findByRole('button', { name: '학생 홈으로 가기' }),
  ).toBeVisible();
});

it('로그인하지 않았으면 로그인으로 안내한다', async () => {
  const router = renderNotFound();
  await userEvent.click(
    await screen.findByRole('button', { name: '로그인으로 가기' }),
  );
  await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
});
