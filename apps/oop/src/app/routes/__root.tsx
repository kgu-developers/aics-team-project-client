import { AstryxThemeProvider, ToastViewport } from '@aics/design-system';
import { Outlet, createRootRoute } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';

import HomeNotFoundPage from '~/app/components/HomeNotFoundPage';
import RouteErrorPage from '~/app/components/RouteErrorPage';

import { QueryProvider } from '../providers/query-provider';

import '../globals.css';

import '../global.css';

export const Route = createRootRoute({
  component: RootRoute,
  errorComponent: RouteErrorPage,
  notFoundComponent: HomeNotFoundPage,
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
