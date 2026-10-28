import { createFileRoute } from '@tanstack/react-router';

function positiveId(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function nonNegativePage(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

export const Route = createFileRoute('/admin/meetings/')({
  validateSearch: (
    search: Record<string, unknown>,
  ): { page?: number; sectionId?: number; teamId?: number } => ({
    page: nonNegativePage(search.page),
    sectionId: positiveId(search.sectionId),
    teamId: positiveId(search.teamId),
  }),
});
