import {
  RouterContextProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from '@tanstack/react-router';
import { render, type RenderResult } from '@testing-library/react';
import type { ReactElement } from 'react';

export function renderWithRouter(ui: ReactElement): RenderResult {
  const rootRoute = createRootRoute();
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });

  return render(
    <RouterContextProvider router={router}>{ui}</RouterContextProvider>,
  );
}
