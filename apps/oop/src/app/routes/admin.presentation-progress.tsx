import { createFileRoute } from '@tanstack/react-router';

function positiveId(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0
    ? String(parsed)
    : undefined;
}

export const Route = createFileRoute('/admin/presentation-progress')({
  validateSearch: (
    search: Record<string, unknown>,
  ): { milestoneId?: string; sectionId?: string; teamId?: string } => ({
    milestoneId: positiveId(search.milestoneId),
    sectionId: positiveId(search.sectionId),
    teamId: positiveId(search.teamId),
  }),
});
