import { AstryxThemeProvider, ToastViewport } from '@aics/design-system';
import { Outlet, createRootRoute } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';

import RouteErrorPage from '~/app/components/RouteErrorPage';
import RouteNotFoundPage from '~/app/components/RouteNotFoundPage';
import { ROUTES } from '~/app/constants/routes';
import { useAuthStore } from '~/features/auth/authStore';

import { QueryProvider } from '../providers/query-provider';

import '../globals.css';

import '../global.css';

export const Route = createRootRoute({
  component: RootRoute,
  errorComponent: RouteErrorPage,
  notFoundComponent: RootNotFoundRoute,
});

function RootRoute() {
  return (
    <AstryxThemeProvider>
      <QueryProvider>
        <ToastViewport position='bottomEnd'>
          <Outlet />
          {import.meta.env.DEV ? <TanStackRouterDevtools /> : null}
        </ToastViewport>
      </QueryProvider>
    </AstryxThemeProvider>
  );
}

function RootNotFoundRoute() {
  const currentUser = useAuthStore(state => state.currentUser);
  const isAdmin =
    currentUser?.globalRole === 'ASSISTANT' ||
    currentUser?.globalRole === 'PROFESSOR';

  return (
    <RouteNotFoundPage
      actionLabel={isAdmin ? '관리자 홈으로 가기' : '학생 홈으로 가기'}
      actionTo={isAdmin ? ROUTES.ADMIN : ROUTES.STUDENT.HOME}
      description={
        isAdmin
          ? '현재 관리자 흐름에 없는 주소입니다.'
          : '현재 학생 흐름에 없는 주소입니다.'
      }
      title='페이지를 찾을 수 없어요.'
    />
  );
}
