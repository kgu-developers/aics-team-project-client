import { createMemoryHistory, createRouter } from '@tanstack/react-router';
import { describe, expect, it } from 'vitest';

import { routeTree } from '~/app/routeTree.gen';

describe('student action plan route', () => {
  it('팀 페이지에 중첩되지 않고 학생 셸 아래에서 렌더링된다', async () => {
    const router = createRouter({
      history: createMemoryHistory({
        initialEntries: ['/student/team/action-plans'],
      }),
      routeTree,
    });

    await router.load();

    expect(router.state.matches.map(match => match.routeId)).toEqual([
      '__root__',
      '/student',
      '/student/team_/action-plans',
    ]);
  });
});
