import type { Page } from '@playwright/test';
import { expect, test, vi } from 'vitest';

import type { Run } from '../../e2e/integrated/data';
import { createNotice } from '../../e2e/integrated/notices';

const readiness = vi.hoisted(() => ({
  route: false,
  heading: false,
  form: false,
}));
const choose = vi.hoisted(() => vi.fn());

vi.mock('../../e2e/integrated/ui', () => ({ choose }));
vi.mock('@playwright/test', () => ({
  expect: (subject: unknown) => ({
    toHaveURL: async (matches: (url: URL) => boolean) => {
      for (const path of [
        '/admin/notices/new',
        '/admin/notices/new?sectionId=17',
      ])
        expect(matches(new URL(path, 'https://example.invalid'))).toBe(true);
      for (const path of [
        '/admin/notices',
        '/admin/notices?sectionId=17',
        '/admin/notices/17/edit',
        '/admin/notices/new/extra',
        '/prefix/admin/notices/new',
      ])
        expect(matches(new URL(path, 'https://example.invalid'))).toBe(false);
      // Resolve on a later microtask so omitting await reproduces the race.
      await Promise.resolve();
      readiness.route = true;
    },
    toBeVisible: async () => {
      if ((subject as { role: string }).role !== 'heading') return;
      expect(readiness.route).toBe(true);
      expect(subject).toEqual({
        role: 'heading',
        level: 1,
        name: '공지사항 작성',
        exact: true,
      });
      await Promise.resolve();
      readiness.heading = true;
    },
    toBeEditable: async () => {
      expect(readiness.heading).toBe(true);
      expect(subject).toEqual({
        role: 'textbox',
        name: '제목',
        exact: true,
      });
      await Promise.resolve();
      readiness.form = true;
    },
  }),
}));

test('notice creation waits for the exact create route and ready form before selecting a section', async () => {
  const selected = new Error('Reached create-page section selection');
  const page = {
    goto: vi.fn().mockResolvedValue(undefined),
    reload: vi.fn().mockResolvedValue(undefined),
    getByRole: (role: string, options: object) =>
      role === 'button'
        ? { click: vi.fn().mockResolvedValue(undefined) }
        : { role, ...options },
  } as unknown as Page;
  const run = { section: 'E2E249-section' } as Run;
  choose.mockImplementation(async (scope, label, option) => {
    expect(readiness).toEqual({ route: true, heading: true, form: true });
    expect([scope, label, option]).toEqual([page, '분반', run.section]);
    // Stop before publication; this regression exercises navigation only.
    throw selected;
  });

  await expect(createNotice(page, run, vi.fn(), vi.fn())).rejects.toBe(
    selected,
  );
  expect(choose).toHaveBeenCalledTimes(1);
});
