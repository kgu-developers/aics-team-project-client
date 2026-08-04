import { AstryxThemeProvider } from '@aics/design-system';
import { Outlet, createRootRoute } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';

import RouteNotFoundPage from '~/app/components/RouteNotFoundPage';

import { QueryProvider } from '../providers/query-provider';

import '../globals.css';

export const Route = createRootRoute({
  component: RootRoute,
  notFoundComponent: RootNotFoundRoute,
});

function RootRoute() {
  return (
    <AstryxThemeProvider>
      <QueryProvider>
        <Outlet />
        <TanStackRouterDevtools />
      </QueryProvider>
    </AstryxThemeProvider>
  );
}

function RootNotFoundRoute() {
  return (
    <RouteNotFoundPage
      actionLabel='학생 홈으로 가기'
      actionTo='/student'
      description='현재 학생 흐름에 없는 주소입니다.'
      title='페이지를 찾을 수 없어요.'
    />
  );
}
