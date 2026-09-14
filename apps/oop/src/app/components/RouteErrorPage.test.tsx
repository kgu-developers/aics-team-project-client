import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';

import RouteErrorPage from './RouteErrorPage';

it('contains a throwing child without normal providers and retries its loader', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    let failing = true;
    const loader = vi.fn(() => {
      if (failing) throw new Error('private implementation details');
      return null;
    });
    const root = createRootRoute({ errorComponent: RouteErrorPage });
    const child = createRoute({
      getParentRoute: () => root,
      path: '/',
      loader,
      component: () => <h1>복구된 화면</h1>,
    });
    const router = createRouter({
      routeTree: root.addChildren([child]),
      history: createMemoryHistory({ initialEntries: ['/'] }),
    });
    render(<RouterProvider router={router} />);
    expect(
      await screen.findByText('화면을 불러오지 못했어요.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('private implementation details'),
    ).not.toBeInTheDocument();
    failing = false;
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: '다시 시도' }));
    expect(
      await screen.findByRole('heading', { name: '복구된 화면' }),
    ).toBeInTheDocument();
    expect(loader).toHaveBeenCalledTimes(2);
  } finally {
    error.mockRestore();
    warn.mockRestore();
  }
});
