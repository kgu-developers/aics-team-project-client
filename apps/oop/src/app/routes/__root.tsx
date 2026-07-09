import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';

import { QueryProvider } from '../providers/query-provider';

import '../globals.css';

export const Route = createRootRoute({
  component: () => (
    <QueryProvider>
      <Outlet />
      <TanStackRouterDevtools />
    </QueryProvider>
  ),
});
