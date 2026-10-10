import { AstryxThemeProvider } from '@aics/design-system';
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import AdminTeamActivityTabs from './AdminTeamActivityTabs';

function renderTabs(initialEntry: string) {
  const rootRoute = createRootRoute();
  const meetingsRoute = createRoute({
    component: () => (
      <AstryxThemeProvider>
        <AdminTeamActivityTabs activeView='meetings' sectionId='1' teamId='2' />
      </AstryxThemeProvider>
    ),
    getParentRoute: () => rootRoute,
    path: '/admin/meetings',
  });
  const actionsRoute = createRoute({
    component: () => (
      <AstryxThemeProvider>
        <AdminTeamActivityTabs activeView='actions' sectionId='1' teamId='2' />
      </AstryxThemeProvider>
    ),
    getParentRoute: () => rootRoute,
    path: '/admin/meeting-actions',
  });
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
    routeTree: rootRoute.addChildren([meetingsRoute, actionsRoute]),
  });

  render(<RouterProvider router={router} />);

  return router;
}

describe('AdminTeamActivityTabs', () => {
  it('선택한 분반과 팀을 유지한 채 회의록에서 액션플랜으로 이동한다', async () => {
    const user = userEvent.setup();
    const router = renderTabs('/admin/meetings');

    await user.click(await screen.findByRole('button', { name: '액션플랜' }));

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/admin/meeting-actions'),
    );
    expect(router.state.location.search).toEqual({
      sectionId: '1',
      teamId: '2',
    });
  });

  it('선택한 분반과 팀을 유지한 채 액션플랜에서 회의록으로 이동한다', async () => {
    const user = userEvent.setup();
    const router = renderTabs('/admin/meeting-actions');

    await user.click(await screen.findByRole('button', { name: '회의록' }));

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/admin/meetings'),
    );
    expect(router.state.location.search).toEqual({
      sectionId: '1',
      teamId: '2',
    });
  });
});
