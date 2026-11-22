import { createFileRoute } from '@tanstack/react-router';

function positiveId(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0
    ? String(parsed)
    : undefined;
}

export function validatePresentationProgressSearch(
  search: Record<string, unknown>,
): { milestoneId?: string; sectionId?: string; teamId?: string } {
  return {
    milestoneId: positiveId(search.milestoneId),
    sectionId: positiveId(search.sectionId),
    // Keep supplied invalid IDs distinct from an omitted team ID.
    teamId: search.teamId === undefined ? undefined : String(search.teamId),
  };
}

export const Route = createFileRoute('/admin/presentation-progress')({
  validateSearch: validatePresentationProgressSearch,
});
