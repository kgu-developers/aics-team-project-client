import { createFileRoute, redirect } from '@tanstack/react-router';

function sectionId(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number(value);

  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function tab(value: unknown) {
  return value === 'roster' || value === 'survey' ? value : undefined;
}

export const Route = createFileRoute('/admin/sections/$courseId')({
  beforeLoad: ({ search }) => {
    if (search.sectionId === undefined) {
      throw redirect({ replace: true, to: '/admin/sections' });
    }
  },
  validateSearch: (
    search: Record<string, unknown>,
  ): { sectionId?: number; tab?: 'roster' | 'survey' } => ({
    sectionId: sectionId(search.sectionId),
    tab: tab(search.tab),
  }),
});
